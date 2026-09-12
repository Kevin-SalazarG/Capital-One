CREATE FUNCTION mirror.set_context(p_user_id uuid, p_business_id uuid, p_require_membership boolean DEFAULT true)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'BUSINESS_ACCESS_DENIED' USING ERRCODE = '42501';
  END IF;
  PERFORM set_config('mirror.user_id', p_user_id::text, true);
  PERFORM set_config('mirror.business_id', COALESCE(p_business_id::text, ''), true);
  IF p_require_membership AND NOT EXISTS (
    SELECT 1 FROM mirror.memberships WHERE "businessId" = p_business_id AND "userId" = p_user_id AND active
  ) THEN
    RAISE EXCEPTION 'BUSINESS_ACCESS_DENIED' USING ERRCODE = '42501';
  END IF;
END
$$;

CREATE FUNCTION mirror.assert_state_limits(p_business_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  target_table text;
  row_count integer;
BEGIN
  FOREACH target_table IN ARRAY ARRAY['bank_accounts','bank_movements','sync_runs','commitments','budgets','reconciliations','evaluations','decisions','decision_conditions','idempotency','audit_events'] LOOP
    EXECUTE format('SELECT count(*) FROM (SELECT 1 FROM mirror.%I WHERE "businessId" = $1 LIMIT 10001) AS bounded_rows', target_table)
      INTO row_count USING p_business_id;
    IF row_count > 10000 THEN
      RAISE EXCEPTION 'DATASET_LIMIT' USING ERRCODE = '54000';
    END IF;
  END LOOP;
END
$$;

CREATE FUNCTION public.mirror_state(p_user_id uuid, p_business_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET lock_timeout = '2s'
AS $$
DECLARE
  business mirror.businesses%ROWTYPE;
  result jsonb;
BEGIN
  PERFORM mirror.set_context(p_user_id, p_business_id);
  -- Every writer takes the same parent lock, keeping this multi-table read coherent.
  SELECT * INTO STRICT business FROM mirror.businesses WHERE id = p_business_id FOR SHARE;
  PERFORM mirror.assert_state_limits(p_business_id);
  result := jsonb_build_object(
    'revision', business."dataRevision",
    'business', (to_jsonb(business) - 'dataRevision') || jsonb_build_object('cushion', business.cushion::text, 'openingBalance', business."openingBalance"::text),
    'accounts', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM mirror.bank_accounts t WHERE "businessId" = p_business_id), '[]'::jsonb),
    'movements', COALESCE((SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object('amount', t.amount::text) ORDER BY t.id) FROM mirror.bank_movements t WHERE "businessId" = p_business_id), '[]'::jsonb),
    'syncRuns', COALESCE((SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object('sequence', t.sequence::text) ORDER BY t.sequence) FROM mirror.sync_runs t WHERE "businessId" = p_business_id), '[]'::jsonb),
    'commitments', COALESCE((SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object('amount', t.amount::text) ORDER BY t.id) FROM mirror.commitments t WHERE "businessId" = p_business_id), '[]'::jsonb),
    'budgets', COALESCE((SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object('amount', t.amount::text) ORDER BY t.id) FROM mirror.budgets t WHERE "businessId" = p_business_id), '[]'::jsonb),
    'reconciliations', COALESCE((SELECT jsonb_agg(to_jsonb(t) || jsonb_build_object('amount', t.amount::text) ORDER BY t.id) FROM mirror.reconciliations t WHERE "businessId" = p_business_id), '[]'::jsonb),
    'evaluations', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM mirror.evaluations t WHERE "businessId" = p_business_id), '[]'::jsonb),
    'decisions', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM mirror.decisions t WHERE "businessId" = p_business_id), '[]'::jsonb),
    'conditions', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM mirror.decision_conditions t WHERE "businessId" = p_business_id), '[]'::jsonb),
    'idempotency', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM mirror.idempotency t WHERE "businessId" = p_business_id), '[]'::jsonb),
    'auditEvents', COALESCE((SELECT jsonb_agg(to_jsonb(t) ORDER BY t.id) FROM mirror.audit_events t WHERE "businessId" = p_business_id), '[]'::jsonb)
  );
  IF octet_length(result::text) > 33554432 THEN
    RAISE EXCEPTION 'DATASET_LIMIT' USING ERRCODE = '54000';
  END IF;
  RETURN result;
END
$$;

CREATE FUNCTION mirror.apply_row(p_key text, p_row jsonb, p_business_id uuid, p_previous_version integer, p_next_version integer)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  target_table text;
  allowed text[];
  mutable text[];
  field text;
  previous jsonb;
  normalized jsonb;
  columns_sql text;
  assignments_sql text;
  candidate_id uuid;
  evaluation_job text;
  evaluation_version integer;
BEGIN
  CASE p_key
    WHEN 'accounts' THEN
      target_table := 'bank_accounts';
      allowed := ARRAY['id','businessId','provider','connectionId','externalId','createdAt'];
      mutable := ARRAY[]::text[];
    WHEN 'movements' THEN
      target_table := 'bank_movements';
      allowed := ARRAY['id','businessId','accountId','provider','resourceType','externalId','status','direction','amount','bookedDate','classification','category','description','createdAt','updatedAt'];
      mutable := ARRAY['status','direction','amount','bookedDate','classification','category','description','updatedAt'];
    WHEN 'syncRuns' THEN
      target_table := 'sync_runs';
      allowed := ARRAY['id','businessId','sequence','requestRevision','status','source','cutoff','errorCode','startedAt','completedAt'];
      mutable := ARRAY['status','source','cutoff','errorCode','completedAt'];
    WHEN 'commitments' THEN
      target_table := 'commitments';
      allowed := ARRAY['id','businessId','title','kind','amount','dueDate','category','status','source','negotiable','occurrenceKey','conservativeDate','decisionId','createdAt','updatedAt'];
      mutable := ARRAY['title','kind','amount','dueDate','category','status','negotiable','conservativeDate','updatedAt'];
    WHEN 'budgets' THEN
      target_table := 'budgets';
      allowed := ARRAY['id','businessId','category','periodStart','periodEnd','amount'];
      mutable := ARRAY['amount'];
    WHEN 'reconciliations' THEN
      target_table := 'reconciliations';
      allowed := ARRAY['id','businessId','movementId','commitmentId','amount','evidence','active','createdBy','createdAt','correctedAt'];
      mutable := ARRAY['active','correctedAt'];
    WHEN 'evaluations' THEN
      target_table := 'evaluations';
      allowed := ARRAY['id','businessId','createdBy','planningVersion','engineVersion','snapshot','job','result','createdAt'];
      mutable := ARRAY[]::text[];
    WHEN 'decisions' THEN
      target_table := 'decisions';
      allowed := ARRAY['id','businessId','evaluationId','jobId','alternativeId','status','createdBy','creationVersion','createdAt','updatedAt'];
      mutable := ARRAY['status','updatedAt'];
    WHEN 'conditions' THEN
      target_table := 'decision_conditions';
      allowed := ARRAY['id','businessId','decisionId','kind','status','evidence','updatedBy','updatedAt'];
      mutable := ARRAY['status','evidence','updatedBy','updatedAt'];
    WHEN 'idempotency' THEN
      target_table := 'idempotency';
      allowed := ARRAY['id','businessId','userId','key','requestHash','decisionId','createdAt'];
      mutable := ARRAY[]::text[];
    WHEN 'auditEvents' THEN
      target_table := 'audit_events';
      allowed := ARRAY['id','businessId','userId','action','entityId','metadata','createdAt'];
      mutable := ARRAY[]::text[];
    ELSE RAISE EXCEPTION 'INVALID_STATE_CHANGE' USING ERRCODE = '22023';
  END CASE;
  IF jsonb_typeof(p_row) <> 'object' OR p_row ->> 'businessId' IS DISTINCT FROM p_business_id::text OR p_row ->> 'id' IS NULL THEN
    RAISE EXCEPTION 'INVALID_STATE_CHANGE' USING ERRCODE = '22023';
  END IF;
  candidate_id := (p_row ->> 'id')::uuid;
  FOR field IN SELECT jsonb_object_keys(p_row) LOOP
    IF NOT field = ANY(allowed) THEN
      RAISE EXCEPTION 'INVALID_STATE_CHANGE' USING ERRCODE = '22023';
    END IF;
  END LOOP;
  IF p_row ? 'amount' AND (jsonb_typeof(p_row -> 'amount') <> 'string' OR p_row ->> 'amount' !~ '^[0-9]{1,12}(\.[0-9]{1,2})?$') THEN
    RAISE EXCEPTION 'INVALID_MONEY' USING ERRCODE = '22023';
  END IF;
  EXECUTE format('SELECT to_jsonb(t) FROM mirror.%I t WHERE id = $1', target_table) INTO previous USING candidate_id;
  IF previous IS NOT NULL THEN
    IF cardinality(mutable) = 0 THEN
      RAISE EXCEPTION 'HISTORY_IMMUTABLE' USING ERRCODE = '23514';
    END IF;
    EXECUTE format('SELECT to_jsonb(jsonb_populate_record(NULL::mirror.%I, $1))', target_table)
      INTO normalized USING previous || p_row;
    FOREACH field IN ARRAY allowed LOOP
      IF NOT field = ANY(mutable) AND normalized -> field IS DISTINCT FROM previous -> field THEN
        RAISE EXCEPTION 'IDENTITY_IMMUTABLE' USING ERRCODE = '23514';
      END IF;
    END LOOP;
    SELECT string_agg(format('%I = source.%I', value, value), ', ' ORDER BY value)
      INTO assignments_sql FROM unnest(mutable) AS value WHERE p_row ? value;
    IF assignments_sql IS NOT NULL THEN
      EXECUTE format('UPDATE mirror.%I AS target SET %s FROM jsonb_populate_record(NULL::mirror.%I, $1) AS source WHERE target.id = $2', target_table, assignments_sql, target_table)
        USING normalized, candidate_id;
    END IF;
  ELSE
    IF p_key = 'syncRuns' THEN
      RAISE EXCEPTION 'USE_BEGIN_SYNC' USING ERRCODE = '22023';
    END IF;
    IF p_row ? 'createdBy' AND p_row ->> 'createdBy' IS DISTINCT FROM mirror.current_identity()::text THEN
      RAISE EXCEPTION 'BUSINESS_ACCESS_DENIED' USING ERRCODE = '42501';
    END IF;
    IF p_row ? 'userId' AND p_row ->> 'userId' IS DISTINCT FROM mirror.current_identity()::text THEN
      RAISE EXCEPTION 'BUSINESS_ACCESS_DENIED' USING ERRCODE = '42501';
    END IF;
    IF p_key = 'evaluations' AND (p_row ->> 'planningVersion')::integer IS DISTINCT FROM p_previous_version THEN
      RAISE EXCEPTION 'PLANNING_VERSION_CONFLICT' USING ERRCODE = '40001';
    END IF;
    IF p_key = 'decisions' THEN
      SELECT job ->> 'id', "planningVersion" INTO evaluation_job, evaluation_version
        FROM mirror.evaluations WHERE id = (p_row ->> 'evaluationId')::uuid AND "businessId" = p_business_id;
      IF (p_row ->> 'creationVersion')::integer IS DISTINCT FROM p_next_version OR p_next_version <> p_previous_version + 1
        OR evaluation_version IS DISTINCT FROM p_previous_version OR evaluation_job IS DISTINCT FROM p_row ->> 'jobId' THEN
        RAISE EXCEPTION 'PLANNING_VERSION_CONFLICT' USING ERRCODE = '40001';
      END IF;
    END IF;
    SELECT string_agg(format('%I', value), ', ' ORDER BY value)
      INTO columns_sql FROM jsonb_object_keys(p_row) AS value;
    EXECUTE format('INSERT INTO mirror.%I (%s) SELECT %s FROM jsonb_populate_record(NULL::mirror.%I, $1)', target_table, columns_sql, columns_sql, target_table)
      USING p_row;
  END IF;
END
$$;

CREATE FUNCTION public.mirror_apply_state(p_user_id uuid, p_business_id uuid, p_revision integer, p_changes jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET lock_timeout = '2s'
AS $$
DECLARE
  previous mirror.businesses%ROWTYPE;
  next_business mirror.businesses%ROWTYPE;
  field text;
  row_change jsonb;
  needs_version boolean := false;
  allowed_business text[] := ARRAY['id','name','currency','timezone','cushion','planningVersion','dataComplete','cutoff','openingBalance','source','sourceSyncedAt','createdAt','updatedAt'];
BEGIN
  PERFORM mirror.set_context(p_user_id, p_business_id);
  SELECT * INTO STRICT previous FROM mirror.businesses WHERE id = p_business_id FOR UPDATE;
  IF p_revision IS DISTINCT FROM previous."dataRevision" THEN
    RAISE EXCEPTION 'PLANNING_VERSION_CONFLICT' USING ERRCODE = '40001';
  END IF;
  IF p_changes IS NULL OR jsonb_typeof(p_changes) <> 'object' THEN
    RAISE EXCEPTION 'INVALID_STATE_CHANGE' USING ERRCODE = '22023';
  END IF;
  IF octet_length(p_changes::text) > 33554432 THEN
    RAISE EXCEPTION 'DATASET_LIMIT' USING ERRCODE = '54000';
  END IF;
  FOR field IN SELECT jsonb_object_keys(p_changes) LOOP
    IF NOT field = ANY(ARRAY['business','accounts','movements','syncRuns','commitments','budgets','reconciliations','evaluations','decisions','conditions','idempotency','auditEvents']) THEN
      RAISE EXCEPTION 'INVALID_STATE_CHANGE' USING ERRCODE = '22023';
    END IF;
    IF field <> 'business' AND jsonb_typeof(p_changes -> field) <> 'array' THEN
      RAISE EXCEPTION 'INVALID_STATE_CHANGE' USING ERRCODE = '22023';
    END IF;
    IF field <> 'business' AND jsonb_array_length(p_changes -> field) > 10000 THEN
      RAISE EXCEPTION 'DATASET_LIMIT' USING ERRCODE = '54000';
    END IF;
    IF field = ANY(ARRAY['accounts','movements','commitments','budgets','reconciliations','decisions','conditions'])
      AND jsonb_array_length(p_changes -> field) > 0 THEN
      needs_version := true;
    END IF;
  END LOOP;
  next_business := previous;
  IF p_changes ? 'business' THEN
    IF jsonb_typeof(p_changes -> 'business') <> 'object' THEN
      RAISE EXCEPTION 'INVALID_STATE_CHANGE' USING ERRCODE = '22023';
    END IF;
    FOR field IN SELECT jsonb_object_keys(p_changes -> 'business') LOOP
      IF NOT field = ANY(allowed_business) THEN
        RAISE EXCEPTION 'INVALID_STATE_CHANGE' USING ERRCODE = '22023';
      END IF;
      IF field = ANY(ARRAY['cushion','openingBalance']) AND (jsonb_typeof(p_changes -> 'business' -> field) <> 'string' OR p_changes -> 'business' ->> field !~ '^-?[0-9]{1,12}(\.[0-9]{1,2})?$') THEN
        RAISE EXCEPTION 'INVALID_MONEY' USING ERRCODE = '22023';
      END IF;
    END LOOP;
    next_business := jsonb_populate_record(previous, p_changes -> 'business');
    IF next_business.id IS DISTINCT FROM previous.id OR next_business."createdAt" IS DISTINCT FROM previous."createdAt" THEN
      RAISE EXCEPTION 'IDENTITY_IMMUTABLE' USING ERRCODE = '23514';
    END IF;
    needs_version := needs_version OR
      (next_business.name, next_business.currency, next_business.timezone, next_business.cushion,
       next_business."dataComplete", next_business.cutoff, next_business."openingBalance", next_business.source, next_business."sourceSyncedAt")
      IS DISTINCT FROM
      (previous.name, previous.currency, previous.timezone, previous.cushion,
       previous."dataComplete", previous.cutoff, previous."openingBalance", previous.source, previous."sourceSyncedAt");
  END IF;
  IF (needs_version AND next_business."planningVersion" <> previous."planningVersion" + 1)
    OR (NOT needs_version AND next_business."planningVersion" NOT IN (previous."planningVersion", previous."planningVersion" + 1)) THEN
    RAISE EXCEPTION 'PLANNING_VERSION_CONFLICT' USING ERRCODE = '40001';
  END IF;
  -- Release old matches before applying parent edits and replacement evidence.
  FOR row_change IN SELECT value FROM jsonb_array_elements(COALESCE(p_changes -> 'reconciliations', '[]'::jsonb)) WHERE value -> 'active' = 'false'::jsonb LOOP
    PERFORM mirror.apply_row('reconciliations', row_change, p_business_id, previous."planningVersion", next_business."planningVersion");
  END LOOP;
  FOREACH field IN ARRAY ARRAY['evaluations','decisions','accounts','movements','commitments','budgets','reconciliations','conditions','idempotency','auditEvents','syncRuns'] LOOP
    FOR row_change IN SELECT value FROM jsonb_array_elements(COALESCE(p_changes -> field, '[]'::jsonb)) LOOP
      IF field <> 'reconciliations' OR row_change -> 'active' IS DISTINCT FROM 'false'::jsonb THEN
        PERFORM mirror.apply_row(field, row_change, p_business_id, previous."planningVersion", next_business."planningVersion");
      END IF;
    END LOOP;
  END LOOP;
  UPDATE mirror.businesses SET name = next_business.name, currency = next_business.currency,
    timezone = next_business.timezone, cushion = next_business.cushion, "planningVersion" = next_business."planningVersion",
    "dataComplete" = next_business."dataComplete", cutoff = next_business.cutoff, "openingBalance" = next_business."openingBalance",
    source = next_business.source, "sourceSyncedAt" = next_business."sourceSyncedAt", "updatedAt" = CURRENT_TIMESTAMP,
    "dataRevision" = previous."dataRevision" + 1
  WHERE id = p_business_id;
  PERFORM public.mirror_state(p_user_id, p_business_id);
  RETURN jsonb_build_object('revision', previous."dataRevision" + 1);
END
$$;

CREATE FUNCTION public.mirror_list_businesses(p_user_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result jsonb;
BEGIN
  PERFORM mirror.set_context(p_user_id, NULL, false);
  IF (SELECT count(*) FROM (SELECT 1 FROM mirror.businesses LIMIT 10001) AS bounded_rows) > 10000 THEN
    RAISE EXCEPTION 'DATASET_LIMIT' USING ERRCODE = '54000';
  END IF;
  result := COALESCE((SELECT jsonb_agg((to_jsonb(t) - 'dataRevision') || jsonb_build_object('cushion', t.cushion::text, 'openingBalance', t."openingBalance"::text) ORDER BY t.id) FROM mirror.businesses t), '[]'::jsonb);
  IF octet_length(result::text) > 33554432 THEN
    RAISE EXCEPTION 'DATASET_LIMIT' USING ERRCODE = '54000';
  END IF;
  RETURN result;
END
$$;

-- Auth's managed table enforces its own RLS. This fixed lookup is the only helper
-- owned by the migration administrator; the business executor never gains bypass.
CREATE FUNCTION mirror.auth_session_exists(p_user_id uuid, p_session_id uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$ SELECT EXISTS (SELECT 1 FROM auth.sessions WHERE id = p_session_id AND user_id = p_user_id) $$;

CREATE FUNCTION public.mirror_session_status(p_user_id uuid, p_session_id uuid) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM mirror.set_context(p_user_id, NULL, false);
  RETURN jsonb_build_object(
    'active', mirror.auth_session_exists(p_user_id, p_session_id),
    'revoked', EXISTS (SELECT 1 FROM mirror.session_revocations WHERE "userId" = p_user_id AND "sessionId" = p_session_id)
  );
END
$$;

CREATE FUNCTION public.mirror_revoke_session(p_user_id uuid, p_session_id uuid, p_expires_at timestamptz) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  PERFORM mirror.set_context(p_user_id, NULL, false);
  INSERT INTO mirror.session_revocations ("userId", "sessionId", "expiresAt") VALUES (p_user_id, p_session_id, p_expires_at)
    ON CONFLICT ("userId", "sessionId") DO NOTHING;
  RETURN jsonb_build_object('revoked', true);
END
$$;

CREATE FUNCTION public.mirror_begin_sync(p_user_id uuid, p_business_id uuid, p_expected_version integer, p_cutoff date) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' SET lock_timeout = '2s'
AS $$
DECLARE
  business mirror.businesses%ROWTYPE;
  run mirror.sync_runs%ROWTYPE;
BEGIN
  PERFORM mirror.set_context(p_user_id, p_business_id);
  SELECT * INTO STRICT business FROM mirror.businesses WHERE id = p_business_id FOR UPDATE;
  IF p_expected_version IS DISTINCT FROM business."planningVersion" THEN
    RAISE EXCEPTION 'PLANNING_VERSION_CONFLICT' USING ERRCODE = '40001';
  END IF;
  INSERT INTO mirror.sync_runs ("businessId", "requestRevision", status, source, cutoff)
    VALUES (p_business_id, p_expected_version, 'running', business.source, p_cutoff) RETURNING * INTO run;
  UPDATE mirror.businesses SET "dataRevision" = "dataRevision" + 1 WHERE id = p_business_id;
  PERFORM public.mirror_state(p_user_id, p_business_id);
  RETURN to_jsonb(run) || jsonb_build_object('sequence', run.sequence::text);
END
$$;

CREATE FUNCTION public.mirror_seed_business(p_user_id uuid, p_business_id uuid, p_mode text, p_customer_id text, p_account_id text, p_cutoff date) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  replay boolean := p_mode = 'replay';
BEGIN
  PERFORM mirror.set_context(p_user_id, p_business_id, false);
  IF p_mode IS NULL OR p_customer_id IS NULL OR p_account_id IS NULL
    OR p_mode NOT IN ('replay', 'nessie_live') OR p_cutoff IS NULL OR p_business_id IS NULL
    OR p_customer_id !~ '^[a-fA-F0-9]{24}$' OR p_account_id !~ '^[a-fA-F0-9]{24}$'
    OR (replay AND (p_cutoff <> '2026-09-12'::date OR p_customer_id <> '222222222222222222222222' OR p_account_id <> '111111111111111111111111')) THEN
    RAISE EXCEPTION 'INVALID_SYNTHETIC_SETUP' USING ERRCODE = '22023';
  END IF;
  INSERT INTO mirror.businesses (id, name, cushion, cutoff, "openingBalance", source, "sourceSyncedAt", "dataComplete")
    VALUES (p_business_id, 'Ana — Synthetic Office Cleaning', 10000.00, p_cutoff, CASE WHEN replay THEN 50000.00 ELSE 0.00 END,
      CASE WHEN replay THEN 'replay' ELSE 'unavailable' END, CASE WHEN replay THEN '2026-09-12T18:00:00Z'::timestamptz ELSE NULL END, replay);
  INSERT INTO mirror.memberships ("businessId", "userId") VALUES (p_business_id, p_user_id);
  INSERT INTO mirror.bank_accounts ("businessId", provider, "connectionId", "externalId") VALUES (p_business_id, 'nessie', p_customer_id, p_account_id);
  INSERT INTO mirror.commitments ("businessId", title, kind, amount, "dueDate", category, negotiable, source, "occurrenceKey")
    VALUES (p_business_id, 'Existing payroll', 'outflow', 30000.00, p_cutoff + 18, 'payroll', false, 'manual', 'reference:payroll');
  INSERT INTO mirror.budgets ("businessId", category, "periodStart", "periodEnd", amount)
    VALUES (p_business_id, 'payroll', p_cutoff, p_cutoff + 30, 30000.00);
  RETURN jsonb_build_object('businessId', p_business_id);
END
$$;

CREATE FUNCTION public.mirror_health() RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF current_user <> 'mirror_executor' OR EXISTS (
    SELECT 1 FROM pg_roles WHERE rolname = current_user AND (rolsuper OR rolbypassrls OR rolcanlogin)
  ) OR EXISTS (
    SELECT 1 FROM pg_class WHERE relnamespace = 'mirror'::regnamespace AND relkind = 'r'
      AND (NOT relrowsecurity OR NOT relforcerowsecurity OR pg_get_userbyid(relowner) = current_user)
  ) THEN
    RAISE EXCEPTION 'UNSAFE_DATABASE_EXECUTOR' USING ERRCODE = '42501';
  END IF;
  PERFORM 1 FROM mirror.businesses LIMIT 1;
  RETURN jsonb_build_object('ready', true);
END
$$;

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mirror FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA mirror TO mirror_executor;
GRANT USAGE ON SCHEMA public TO mirror_executor, service_role;

-- The temporary ownership grant is removed after assigning the RPCs. Tables stay
-- owned by the migration administrator and all executor access remains under RLS.
DO $ownership$
DECLARE
  signature regprocedure;
BEGIN
  EXECUTE format('GRANT mirror_executor TO %I', current_user);
  GRANT CREATE ON SCHEMA public TO mirror_executor;
  FOREACH signature IN ARRAY ARRAY[
    'public.mirror_state(uuid,uuid)'::regprocedure,
    'public.mirror_apply_state(uuid,uuid,integer,jsonb)'::regprocedure,
    'public.mirror_list_businesses(uuid)'::regprocedure,
    'public.mirror_session_status(uuid,uuid)'::regprocedure,
    'public.mirror_revoke_session(uuid,uuid,timestamptz)'::regprocedure,
    'public.mirror_begin_sync(uuid,uuid,integer,date)'::regprocedure,
    'public.mirror_seed_business(uuid,uuid,text,text,text,date)'::regprocedure,
    'public.mirror_health()'::regprocedure
  ] LOOP
    EXECUTE format('ALTER FUNCTION %s OWNER TO mirror_executor', signature);
    EXECUTE format('ALTER FUNCTION %s SET statement_timeout = %L', signature, '5s');
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', signature);
  END LOOP;
  REVOKE CREATE ON SCHEMA public FROM mirror_executor;
  EXECUTE format('REVOKE mirror_executor FROM %I', current_user);
END
$ownership$;

-- PostgREST applies role settings before starting the RPC statement. The role
-- deadline is authoritative; a function setting alone cannot time prior work.
ALTER ROLE service_role SET statement_timeout = '5s';
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';
