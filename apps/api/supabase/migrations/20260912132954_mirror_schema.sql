DO $role$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mirror_executor') THEN
    CREATE ROLE mirror_executor NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mirror_executor' AND (rolsuper OR rolbypassrls OR rolcanlogin)) THEN
    RAISE EXCEPTION 'mirror_executor requires an isolated non-login role';
  END IF;
END
$role$;

CREATE SCHEMA IF NOT EXISTS "mirror";

CREATE TABLE "mirror"."businesses" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'MXN',
    "timezone" TEXT NOT NULL DEFAULT 'America/Monterrey',
    "cushion" DECIMAL(18,2) NOT NULL,
    "planningVersion" INTEGER NOT NULL DEFAULT 0,
    "dataRevision" INTEGER NOT NULL DEFAULT 0,
    "dataComplete" BOOLEAN NOT NULL DEFAULT false,
    "cutoff" DATE NOT NULL,
    "openingBalance" DECIMAL(18,2) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'replay',
    "sourceSyncedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "businesses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."memberships" (
    "businessId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "memberships_pkey" PRIMARY KEY ("businessId","userId")
);

CREATE TABLE "mirror"."bank_accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "connectionId" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."bank_movements" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "accountId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "bookedDate" DATE NOT NULL,
    "classification" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "bank_movements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."sync_runs" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sequence" BIGINT GENERATED ALWAYS AS IDENTITY,
    "businessId" UUID NOT NULL,
    "requestRevision" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "cutoff" DATE,
    "errorCode" TEXT,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMPTZ(3),

    CONSTRAINT "sync_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."commitments" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "dueDate" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'expected',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "negotiable" BOOLEAN NOT NULL DEFAULT false,
    "occurrenceKey" TEXT,
    "conservativeDate" DATE,
    "decisionId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "commitments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."budgets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "budgets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."reconciliations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "movementId" UUID NOT NULL,
    "commitmentId" UUID NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "evidence" JSONB NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "correctedAt" TIMESTAMPTZ(3),

    CONSTRAINT "reconciliations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."evaluations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "createdBy" UUID NOT NULL,
    "planningVersion" INTEGER NOT NULL,
    "engineVersion" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "job" JSONB NOT NULL,
    "result" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."decisions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "jobId" VARCHAR(40) NOT NULL,
    "businessId" UUID NOT NULL,
    "evaluationId" UUID NOT NULL,
    "alternativeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'registered',
    "createdBy" UUID NOT NULL,
    "creationVersion" INTEGER NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decisions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."decision_conditions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "decisionId" UUID NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "evidence" TEXT,
    "updatedBy" UUID,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decision_conditions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."idempotency" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "requestHash" TEXT NOT NULL,
    "decisionId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "idempotency_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."audit_events" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "businessId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "action" TEXT NOT NULL,
    "entityId" UUID,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mirror"."session_revocations" (
    "userId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "expiresAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "session_revocations_pkey" PRIMARY KEY ("userId","sessionId")
);

CREATE INDEX "memberships_userId_active_idx" ON "mirror"."memberships"("userId", "active");

CREATE UNIQUE INDEX "bank_accounts_businessId_key" ON "mirror"."bank_accounts"("businessId");

CREATE UNIQUE INDEX "bank_accounts_businessId_id_key" ON "mirror"."bank_accounts"("businessId", "id");

CREATE UNIQUE INDEX "bank_accounts_businessId_provider_connectionId_externalId_key" ON "mirror"."bank_accounts"("businessId", "provider", "connectionId", "externalId");

CREATE INDEX "bank_movements_businessId_bookedDate_id_idx" ON "mirror"."bank_movements"("businessId", "bookedDate", "id");

CREATE UNIQUE INDEX "bank_movements_businessId_id_key" ON "mirror"."bank_movements"("businessId", "id");

CREATE UNIQUE INDEX "bank_movements_businessId_accountId_provider_resourceType_e_key" ON "mirror"."bank_movements"("businessId", "accountId", "provider", "resourceType", "externalId");

CREATE INDEX "sync_runs_businessId_startedAt_id_idx" ON "mirror"."sync_runs"("businessId", "startedAt", "id");

CREATE INDEX "commitments_businessId_dueDate_id_idx" ON "mirror"."commitments"("businessId", "dueDate", "id");

CREATE INDEX "commitments_businessId_decisionId_idx" ON "mirror"."commitments"("businessId", "decisionId");

CREATE UNIQUE INDEX "commitments_businessId_id_key" ON "mirror"."commitments"("businessId", "id");

CREATE UNIQUE INDEX "commitments_businessId_occurrenceKey_key" ON "mirror"."commitments"("businessId", "occurrenceKey");

CREATE UNIQUE INDEX "budgets_businessId_category_periodStart_periodEnd_key" ON "mirror"."budgets"("businessId", "category", "periodStart", "periodEnd");

CREATE INDEX "reconciliations_businessId_movementId_idx" ON "mirror"."reconciliations"("businessId", "movementId");

CREATE INDEX "reconciliations_businessId_commitmentId_idx" ON "mirror"."reconciliations"("businessId", "commitmentId");

CREATE INDEX "evaluations_businessId_createdAt_id_idx" ON "mirror"."evaluations"("businessId", "createdAt", "id");

CREATE UNIQUE INDEX "evaluations_businessId_id_key" ON "mirror"."evaluations"("businessId", "id");

CREATE INDEX "decisions_businessId_createdAt_id_idx" ON "mirror"."decisions"("businessId", "createdAt", "id");

CREATE UNIQUE INDEX "decisions_businessId_id_key" ON "mirror"."decisions"("businessId", "id");

CREATE UNIQUE INDEX "decisions_businessId_evaluationId_key" ON "mirror"."decisions"("businessId", "evaluationId");

CREATE INDEX "decision_conditions_businessId_decisionId_idx" ON "mirror"."decision_conditions"("businessId", "decisionId");

CREATE INDEX "idempotency_businessId_decisionId_idx" ON "mirror"."idempotency"("businessId", "decisionId");

CREATE UNIQUE INDEX "idempotency_businessId_userId_key_key" ON "mirror"."idempotency"("businessId", "userId", "key");

CREATE INDEX "audit_events_businessId_createdAt_id_idx" ON "mirror"."audit_events"("businessId", "createdAt", "id");

CREATE INDEX "session_revocations_expiresAt_idx" ON "mirror"."session_revocations"("expiresAt");

ALTER TABLE "mirror"."memberships" ADD CONSTRAINT "memberships_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."bank_accounts" ADD CONSTRAINT "bank_accounts_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."bank_movements" ADD CONSTRAINT "bank_movements_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."bank_movements" ADD CONSTRAINT "bank_movements_businessId_accountId_fkey" FOREIGN KEY ("businessId", "accountId") REFERENCES "mirror"."bank_accounts"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."sync_runs" ADD CONSTRAINT "sync_runs_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."commitments" ADD CONSTRAINT "commitments_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."commitments" ADD CONSTRAINT "commitments_businessId_decisionId_fkey" FOREIGN KEY ("businessId", "decisionId") REFERENCES "mirror"."decisions"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."budgets" ADD CONSTRAINT "budgets_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."reconciliations" ADD CONSTRAINT "reconciliations_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."reconciliations" ADD CONSTRAINT "reconciliations_businessId_movementId_fkey" FOREIGN KEY ("businessId", "movementId") REFERENCES "mirror"."bank_movements"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."reconciliations" ADD CONSTRAINT "reconciliations_businessId_commitmentId_fkey" FOREIGN KEY ("businessId", "commitmentId") REFERENCES "mirror"."commitments"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."evaluations" ADD CONSTRAINT "evaluations_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."decisions" ADD CONSTRAINT "decisions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."decisions" ADD CONSTRAINT "decisions_businessId_evaluationId_fkey" FOREIGN KEY ("businessId", "evaluationId") REFERENCES "mirror"."evaluations"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."decision_conditions" ADD CONSTRAINT "decision_conditions_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."decision_conditions" ADD CONSTRAINT "decision_conditions_businessId_decisionId_fkey" FOREIGN KEY ("businessId", "decisionId") REFERENCES "mirror"."decisions"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."idempotency" ADD CONSTRAINT "idempotency_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."idempotency" ADD CONSTRAINT "idempotency_businessId_decisionId_fkey" FOREIGN KEY ("businessId", "decisionId") REFERENCES "mirror"."decisions"("businessId", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mirror"."audit_events" ADD CONSTRAINT "audit_events_businessId_fkey" FOREIGN KEY ("businessId") REFERENCES "mirror"."businesses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

REVOKE ALL ON SCHEMA mirror FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA mirror FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA mirror FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA mirror TO mirror_executor;

CREATE FUNCTION mirror.current_identity() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT nullif(current_setting('mirror.user_id', true), '')::uuid $$;

CREATE FUNCTION mirror.current_business() RETURNS uuid
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$ SELECT nullif(current_setting('mirror.business_id', true), '')::uuid $$;

ALTER TABLE mirror.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror.memberships FORCE ROW LEVEL SECURITY;
CREATE POLICY own_memberships ON mirror.memberships FOR SELECT TO mirror_executor
  USING ("userId" = (SELECT mirror.current_identity()) AND active);
CREATE POLICY seed_membership ON mirror.memberships FOR INSERT TO mirror_executor
  WITH CHECK ("userId" = (SELECT mirror.current_identity()) AND "businessId" = (SELECT mirror.current_business()));
GRANT SELECT, INSERT ON mirror.memberships TO mirror_executor;

ALTER TABLE mirror.session_revocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror.session_revocations FORCE ROW LEVEL SECURITY;
CREATE POLICY own_session_revocations ON mirror.session_revocations TO mirror_executor
  USING ("userId" = (SELECT mirror.current_identity()))
  WITH CHECK ("userId" = (SELECT mirror.current_identity()));
GRANT SELECT, INSERT ON mirror.session_revocations TO mirror_executor;

CREATE FUNCTION mirror.has_business_access(candidate uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = ''
AS $$
  SELECT candidate = (SELECT mirror.current_business())
    AND EXISTS (
      SELECT 1 FROM mirror.memberships
      WHERE "businessId" = candidate
        AND "userId" = (SELECT mirror.current_identity()) AND active
    )
$$;

ALTER TABLE mirror.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE mirror.businesses FORCE ROW LEVEL SECURITY;
CREATE POLICY business_read ON mirror.businesses FOR SELECT TO mirror_executor
  USING (EXISTS (SELECT 1 FROM mirror.memberships WHERE "businessId" = id AND "userId" = (SELECT mirror.current_identity()) AND active));
CREATE POLICY business_update ON mirror.businesses FOR UPDATE TO mirror_executor
  USING (mirror.has_business_access(id)) WITH CHECK (mirror.has_business_access(id));
CREATE POLICY business_seed ON mirror.businesses FOR INSERT TO mirror_executor
  WITH CHECK (id = (SELECT mirror.current_business()) AND (SELECT mirror.current_identity()) IS NOT NULL);
GRANT SELECT, INSERT, UPDATE ON mirror.businesses TO mirror_executor;

DO $policies$
DECLARE
  tenant_table text;
BEGIN
  FOREACH tenant_table IN ARRAY ARRAY[
    'bank_accounts', 'bank_movements', 'sync_runs', 'commitments', 'budgets',
    'reconciliations', 'evaluations', 'decisions', 'decision_conditions',
    'idempotency', 'audit_events'
  ] LOOP
    EXECUTE format('ALTER TABLE mirror.%I ENABLE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format('ALTER TABLE mirror.%I FORCE ROW LEVEL SECURITY', tenant_table);
    EXECUTE format('CREATE POLICY business_scope ON mirror.%I TO mirror_executor USING (mirror.has_business_access("businessId")) WITH CHECK (mirror.has_business_access("businessId"))', tenant_table);
    EXECUTE format('GRANT SELECT, INSERT ON mirror.%I TO mirror_executor', tenant_table);
  END LOOP;
END
$policies$;

GRANT UPDATE ON mirror.bank_movements, mirror.sync_runs, mirror.commitments,
  mirror.budgets, mirror.reconciliations, mirror.decisions, mirror.decision_conditions TO mirror_executor;
GRANT USAGE, SELECT ON SEQUENCE mirror.sync_runs_sequence_seq TO mirror_executor;

DROP POLICY business_scope ON mirror.idempotency;
CREATE POLICY own_business_response ON mirror.idempotency TO mirror_executor
  USING (mirror.has_business_access("businessId") AND "userId" = (SELECT mirror.current_identity()))
  WITH CHECK (mirror.has_business_access("businessId") AND "userId" = (SELECT mirror.current_identity()));

ALTER TABLE mirror.businesses ADD CONSTRAINT business_data_revision CHECK ("dataRevision" >= 0);
ALTER TABLE mirror.decisions ADD CONSTRAINT decision_job_identity CHECK (length("jobId") BETWEEN 1 AND 40);
CREATE UNIQUE INDEX decisions_business_job ON mirror.decisions ("businessId", "jobId");
CREATE UNIQUE INDEX sync_runs_sequence_unique ON mirror.sync_runs (sequence);
CREATE INDEX sync_runs_business_sequence ON mirror.sync_runs ("businessId", sequence);

ALTER TABLE mirror.businesses
  ADD CONSTRAINT business_money CHECK (cushion >= 0 AND cushion <= 999999999999.99
    AND abs("openingBalance") <= 999999999999.99),
  ADD CONSTRAINT business_version CHECK ("planningVersion" >= 0),
  ADD CONSTRAINT business_currency CHECK (currency = 'MXN'),
  ADD CONSTRAINT business_source CHECK (source IN ('nessie_live', 'replay', 'unavailable'));

ALTER TABLE mirror.bank_movements
  ADD CONSTRAINT movement_amount CHECK (amount > 0 AND amount <= 999999999999.99),
  ADD CONSTRAINT movement_status CHECK (status IN ('pending', 'completed', 'cancelled')),
  ADD CONSTRAINT movement_direction CHECK (direction IN ('inflow', 'outflow'));

ALTER TABLE mirror.sync_runs
  ADD CONSTRAINT sync_revision CHECK ("requestRevision" >= 0),
  ADD CONSTRAINT sync_status CHECK (status IN ('running', 'succeeded', 'failed')),
  ADD CONSTRAINT sync_source CHECK (source IN ('nessie_live', 'replay', 'unavailable'));

ALTER TABLE mirror.commitments
  ADD CONSTRAINT commitment_amount CHECK (amount > 0 AND amount <= 999999999999.99),
  ADD CONSTRAINT commitment_kind CHECK (kind IN ('inflow', 'outflow')),
  ADD CONSTRAINT commitment_status CHECK (status IN ('expected', 'conditional', 'settled', 'cancelled')),
  ADD CONSTRAINT conservative_outflow_date CHECK ("conservativeDate" IS NULL OR (kind = 'outflow' AND "conservativeDate" <= "dueDate")),
  ADD CONSTRAINT protected_obligations CHECK (NOT negotiable OR category NOT IN ('payroll', 'taxes'));

ALTER TABLE mirror.budgets
  ADD CONSTRAINT budget_amount CHECK (amount >= 0 AND amount <= 999999999999.99),
  ADD CONSTRAINT budget_period CHECK ("periodStart" <= "periodEnd");

ALTER TABLE mirror.reconciliations
  ADD CONSTRAINT reconciliation_amount CHECK (amount > 0 AND amount <= 999999999999.99),
  ADD CONSTRAINT reconciliation_correction CHECK ((active AND "correctedAt" IS NULL) OR (NOT active AND "correctedAt" IS NOT NULL));
CREATE UNIQUE INDEX reconciliations_active_match ON mirror.reconciliations ("businessId", "movementId", "commitmentId") WHERE active;

ALTER TABLE mirror.evaluations ADD CONSTRAINT evaluation_version CHECK ("planningVersion" >= 0);
ALTER TABLE mirror.decisions
  ADD CONSTRAINT decision_version CHECK ("creationVersion" > 0),
  ADD CONSTRAINT decision_status CHECK (status IN ('registered', 'review_needed'));
ALTER TABLE mirror.decision_conditions
  ADD CONSTRAINT condition_status CHECK (status IN ('pending', 'confirmed'));
ALTER TABLE mirror.idempotency
  ADD CONSTRAINT idempotency_key_length CHECK (length(key) BETWEEN 1 AND 128),
  ADD CONSTRAINT idempotency_hash CHECK ("requestHash" ~ '^[a-f0-9]{64}$');

CREATE FUNCTION mirror.reject_history_rewrite() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Historical records are immutable' USING ERRCODE = '23514';
END
$$;
REVOKE ALL ON FUNCTION mirror.reject_history_rewrite() FROM PUBLIC;
CREATE TRIGGER evaluations_immutable BEFORE UPDATE OR DELETE ON mirror.evaluations
  FOR EACH ROW EXECUTE FUNCTION mirror.reject_history_rewrite();
CREATE TRIGGER idempotency_immutable BEFORE UPDATE OR DELETE ON mirror.idempotency
  FOR EACH ROW EXECUTE FUNCTION mirror.reject_history_rewrite();
CREATE TRIGGER audit_events_immutable BEFORE UPDATE OR DELETE ON mirror.audit_events
  FOR EACH ROW EXECUTE FUNCTION mirror.reject_history_rewrite();

-- Lock both source rows before checking totals. All application writers also
-- advance the business version; these checks retain the invariant for direct SQL.
CREATE FUNCTION mirror.validate_reconciliation() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  movement mirror.bank_movements%ROWTYPE;
  commitment mirror.commitments%ROWTYPE;
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW."businessId", NEW."movementId", NEW."commitmentId", NEW.amount,
    NEW.evidence, NEW."createdBy", NEW."createdAt") IS DISTINCT FROM
    (OLD."businessId", OLD."movementId", OLD."commitmentId", OLD.amount,
    OLD.evidence, OLD."createdBy", OLD."createdAt") THEN
    RAISE EXCEPTION 'Correct a reconciliation by deactivating it and creating a new record' USING ERRCODE = '23514';
  END IF;
  IF NOT NEW.active THEN
    RETURN NEW;
  END IF;
  SELECT * INTO movement FROM mirror.bank_movements
    WHERE "businessId" = NEW."businessId" AND id = NEW."movementId" FOR UPDATE;
  SELECT * INTO commitment FROM mirror.commitments
    WHERE "businessId" = NEW."businessId" AND id = NEW."commitmentId" FOR UPDATE;
  IF movement.id IS NULL OR commitment.id IS NULL OR movement.status <> 'completed'
    OR commitment.status = 'cancelled' OR movement.direction <> commitment.kind THEN
    RAISE EXCEPTION 'Reconciliation requires matching settled movement and commitment' USING ERRCODE = '23514';
  END IF;
  IF NEW.amount + COALESCE((SELECT sum(amount) FROM mirror.reconciliations
    WHERE "businessId" = NEW."businessId" AND "movementId" = NEW."movementId" AND active AND id <> NEW.id), 0) > movement.amount
    OR NEW.amount + COALESCE((SELECT sum(amount) FROM mirror.reconciliations
    WHERE "businessId" = NEW."businessId" AND "commitmentId" = NEW."commitmentId" AND active AND id <> NEW.id), 0) > commitment.amount THEN
    RAISE EXCEPTION 'Reconciliation exceeds the available amount' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION mirror.validate_reconciliation() FROM PUBLIC;
CREATE TRIGGER reconcile_limits BEFORE INSERT OR UPDATE ON mirror.reconciliations
  FOR EACH ROW EXECUTE FUNCTION mirror.validate_reconciliation();

CREATE FUNCTION mirror.protect_reconciled_movement() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  matched numeric;
BEGIN
  IF (NEW.id, NEW."businessId", NEW."accountId", NEW.provider, NEW."resourceType", NEW."externalId")
    IS DISTINCT FROM
    (OLD.id, OLD."businessId", OLD."accountId", OLD.provider, OLD."resourceType", OLD."externalId") THEN
    RAISE EXCEPTION 'The identity of an observed movement is immutable' USING ERRCODE = '23514';
  END IF;
  SELECT COALESCE(sum(amount), 0) INTO matched FROM mirror.reconciliations
    WHERE "businessId" = NEW."businessId" AND "movementId" = NEW.id AND active;
  IF matched > NEW.amount OR (matched > 0 AND (NEW.status <> 'completed' OR NEW.direction <> OLD.direction)) THEN
    RAISE EXCEPTION 'Correct reconciliations before changing the observed payment' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION mirror.protect_reconciled_movement() FROM PUBLIC;
CREATE TRIGGER movement_reconciliation_guard BEFORE UPDATE ON mirror.bank_movements
  FOR EACH ROW EXECUTE FUNCTION mirror.protect_reconciled_movement();

CREATE FUNCTION mirror.protect_reconciled_commitment() RETURNS trigger
LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$
DECLARE
  matched numeric;
BEGIN
  SELECT COALESCE(sum(amount), 0) INTO matched FROM mirror.reconciliations
    WHERE "businessId" = NEW."businessId" AND "commitmentId" = NEW.id AND active;
  IF matched > NEW.amount OR (matched > 0 AND (NEW.status = 'cancelled' OR NEW.kind <> OLD.kind)) THEN
    RAISE EXCEPTION 'Correct reconciliations before changing the commitment' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END
$$;
REVOKE ALL ON FUNCTION mirror.protect_reconciled_commitment() FROM PUBLIC;
CREATE TRIGGER commitment_reconciliation_guard BEFORE UPDATE ON mirror.commitments
  FOR EACH ROW EXECUTE FUNCTION mirror.protect_reconciled_commitment();

REVOKE ALL ON ALL FUNCTIONS IN SCHEMA mirror FROM PUBLIC, anon, authenticated, service_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA mirror TO mirror_executor;
