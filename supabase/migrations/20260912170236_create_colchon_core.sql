create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 2 and 120),
  legal_name text,
  rfc text,
  currency char(3) not null default 'MXN',
  time_zone text not null default 'America/Mexico_City',
  minimum_cash_reserve numeric(19, 4) not null default 0 check (minimum_cash_reserve >= 0),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'analyst', 'viewer')),
  status text not null default 'active' check (status in ('active', 'invited', 'suspended')),
  invited_by uuid references auth.users(id) on delete set null,
  invited_at timestamptz,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create table public.data_connections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('bank', 'cfdi')),
  provider text not null check (provider in ('nessie', 'synthetic_cfdi')),
  display_name text not null,
  external_customer_id text,
  credential_ref text,
  status text not null default 'active' check (status in ('active', 'paused', 'revoked', 'error')),
  last_synced_at timestamptz,
  last_error_code text,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((kind = 'bank' and provider = 'nessie') or (kind = 'cfdi' and provider = 'synthetic_cfdi'))
);

create table public.sync_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.data_connections(id) on delete cascade,
  status text not null check (status in ('running', 'completed', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  records_read integer not null default 0 check (records_read >= 0),
  records_written integer not null default 0 check (records_written >= 0),
  error_code text,
  error_message text,
  created_at timestamptz not null default now()
);

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.data_connections(id) on delete cascade,
  external_id text not null,
  name text not null,
  type text not null,
  currency char(3) not null default 'USD',
  balance numeric(19, 4) not null,
  available_balance numeric(19, 4),
  status text not null default 'active',
  last_synced_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, external_id)
);

create table public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  connection_id uuid not null references public.data_connections(id) on delete cascade,
  bank_account_id uuid not null references public.bank_accounts(id) on delete cascade,
  external_id text not null,
  direction text not null check (direction in ('inflow', 'outflow', 'transfer')),
  amount numeric(19, 4) not null check (amount >= 0),
  currency char(3) not null default 'USD',
  description text,
  posted_at timestamptz not null,
  status text not null default 'completed',
  category text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (connection_id, external_id)
);

create table public.cfdi_import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source_name text not null,
  source_hash text not null,
  source_object_path text,
  imported_by uuid not null references auth.users(id) on delete restrict,
  imported_at timestamptz not null default now(),
  records_read integer not null default 0 check (records_read >= 0),
  records_created integer not null default 0 check (records_created >= 0),
  records_updated integer not null default 0 check (records_updated >= 0),
  unique (organization_id, source_hash)
);

create table public.cfdi_invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  import_batch_id uuid references public.cfdi_import_batches(id) on delete set null,
  cfdi_uuid text not null,
  direction text not null check (direction in ('receivable', 'payable')),
  issuer_rfc text not null,
  receiver_rfc text not null,
  counterparty_name text,
  issued_at timestamptz not null,
  due_on date,
  total_amount numeric(19, 4) not null check (total_amount >= 0),
  outstanding_amount numeric(19, 4) not null check (outstanding_amount >= 0),
  currency char(3) not null default 'MXN',
  payment_status text not null check (payment_status in ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  expected_collection_probability numeric(5, 4) check (expected_collection_probability between 0 and 1),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, cfdi_uuid)
);

create table public.recurring_obligations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  amount numeric(19, 4) not null check (amount >= 0),
  currency char(3) not null default 'MXN',
  frequency text not null check (frequency in ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_due_on date not null,
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.forecast_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  status text not null check (status in ('running', 'completed', 'failed')),
  horizon_days integer not null check (horizon_days between 1 and 90),
  as_of date not null,
  input_hash text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  engine_version text not null default 'rules-v1',
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  error_code text,
  error_message text,
  unique (organization_id, input_hash)
);

create table public.forecast_points (
  id uuid primary key default gen_random_uuid(),
  forecast_run_id uuid not null references public.forecast_runs(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  point_date date not null,
  opening_balance numeric(19, 4) not null,
  inflows numeric(19, 4) not null default 0,
  outflows numeric(19, 4) not null default 0,
  closing_balance numeric(19, 4) not null,
  safety_threshold numeric(19, 4) not null,
  gap_amount numeric(19, 4) not null default 0 check (gap_amount >= 0),
  created_at timestamptz not null default now(),
  unique (forecast_run_id, point_date)
);

create table public.liquidity_gaps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  forecast_run_id uuid not null references public.forecast_runs(id) on delete cascade,
  gap_date date not null,
  amount numeric(19, 4) not null check (amount >= 0),
  severity text not null check (severity in ('warning', 'critical')),
  status text not null default 'open' check (status in ('open', 'resolved', 'ignored')),
  explanation text not null,
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (forecast_run_id)
);

create table public.recommendations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  forecast_run_id uuid not null references public.forecast_runs(id) on delete cascade,
  liquidity_gap_id uuid references public.liquidity_gaps(id) on delete set null,
  type text not null check (type in ('collect_receivable', 'schedule_payment', 'reduce_outflow', 'increase_buffer')),
  title text not null,
  rationale text not null,
  priority text not null check (priority in ('low', 'medium', 'high', 'critical')),
  estimated_impact numeric(19, 4) not null check (estimated_impact >= 0),
  status text not null default 'open' check (status in ('open', 'accepted', 'dismissed', 'completed')),
  evidence jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  request_id text,
  created_at timestamptz not null default now()
);

create or replace function private.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = target_organization_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
  );
$$;

create or replace function private.has_organization_role(
  target_organization_id uuid,
  allowed_roles text[]
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organization_members member
    where member.organization_id = target_organization_id
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role = any (allowed_roles)
  );
$$;

create or replace function private.is_organization_admin(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select private.has_organization_role(target_organization_id, array['owner', 'admin']);
$$;

create or replace function private.is_organization_creator(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.organizations organization
    where organization.id = target_organization_id
      and organization.created_by = (select auth.uid())
  );
$$;

create or replace function private.can_run_forecast(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select private.has_organization_role(target_organization_id, array['owner', 'admin', 'analyst']);
$$;

revoke all on function private.is_organization_member(uuid) from public;
revoke all on function private.has_organization_role(uuid, text[]) from public;
revoke all on function private.is_organization_admin(uuid) from public;
revoke all on function private.is_organization_creator(uuid) from public;
revoke all on function private.can_run_forecast(uuid) from public;

create or replace function private.prevent_organization_id_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_membership_identity_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.organization_id is distinct from old.organization_id
    or new.user_id is distinct from old.user_id then
    raise exception 'membership identity is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_created_by_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.created_by is distinct from old.created_by then
    raise exception 'created_by is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_imported_by_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.imported_by is distinct from old.imported_by then
    raise exception 'imported_by is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create or replace function private.prevent_forecast_link_change()
returns trigger
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
begin
  if new.forecast_run_id is distinct from old.forecast_run_id then
    raise exception 'forecast_run_id is immutable' using errcode = '42501';
  end if;
  return new;
end;
$$;

create index organization_members_user_status_idx on public.organization_members (user_id, status);
create index organization_members_organization_role_idx on public.organization_members (organization_id, role);
create index data_connections_organization_kind_status_idx on public.data_connections (organization_id, kind, status);
create index sync_runs_connection_started_idx on public.sync_runs (connection_id, started_at desc);
create index bank_accounts_organization_idx on public.bank_accounts (organization_id);
create index bank_transactions_organization_posted_idx on public.bank_transactions (organization_id, posted_at desc);
create index bank_transactions_account_posted_idx on public.bank_transactions (bank_account_id, posted_at desc);
create index cfdi_invoices_organization_due_idx on public.cfdi_invoices (organization_id, direction, payment_status, due_on);
create index cfdi_invoices_open_idx on public.cfdi_invoices (organization_id, due_on) where payment_status in ('pending', 'partial', 'overdue');
create index forecast_runs_organization_started_idx on public.forecast_runs (organization_id, started_at desc);
create index forecast_points_run_date_idx on public.forecast_points (forecast_run_id, point_date);
create index liquidity_gaps_organization_status_date_idx on public.liquidity_gaps (organization_id, status, gap_date);
create index recommendations_organization_status_priority_idx on public.recommendations (organization_id, status, priority);
create index audit_events_organization_created_idx on public.audit_events (organization_id, created_at desc);

create trigger organizations_set_updated_at
before update on public.organizations
for each row execute function private.set_updated_at();
create trigger organization_members_set_updated_at
before update on public.organization_members
for each row execute function private.set_updated_at();
create trigger data_connections_set_updated_at
before update on public.data_connections
for each row execute function private.set_updated_at();
create trigger bank_accounts_set_updated_at
before update on public.bank_accounts
for each row execute function private.set_updated_at();
create trigger bank_transactions_set_updated_at
before update on public.bank_transactions
for each row execute function private.set_updated_at();
create trigger cfdi_invoices_set_updated_at
before update on public.cfdi_invoices
for each row execute function private.set_updated_at();
create trigger recurring_obligations_set_updated_at
before update on public.recurring_obligations
for each row execute function private.set_updated_at();
create trigger liquidity_gaps_set_updated_at
before update on public.liquidity_gaps
for each row execute function private.set_updated_at();
create trigger recommendations_set_updated_at
before update on public.recommendations
for each row execute function private.set_updated_at();

create trigger organization_members_identity_immutable
before update on public.organization_members
for each row execute function private.prevent_membership_identity_change();
create trigger organizations_creator_immutable
before update on public.organizations
for each row execute function private.prevent_created_by_change();
create trigger data_connections_tenant_immutable
before update on public.data_connections
for each row execute function private.prevent_organization_id_change();
create trigger data_connections_creator_immutable
before update on public.data_connections
for each row execute function private.prevent_created_by_change();
create trigger sync_runs_tenant_immutable
before update on public.sync_runs
for each row execute function private.prevent_organization_id_change();
create trigger bank_accounts_tenant_immutable
before update on public.bank_accounts
for each row execute function private.prevent_organization_id_change();
create trigger bank_transactions_tenant_immutable
before update on public.bank_transactions
for each row execute function private.prevent_organization_id_change();
create trigger cfdi_batches_tenant_immutable
before update on public.cfdi_import_batches
for each row execute function private.prevent_organization_id_change();
create trigger cfdi_batches_importer_immutable
before update on public.cfdi_import_batches
for each row execute function private.prevent_imported_by_change();
create trigger cfdi_invoices_tenant_immutable
before update on public.cfdi_invoices
for each row execute function private.prevent_organization_id_change();
create trigger recurring_obligations_tenant_immutable
before update on public.recurring_obligations
for each row execute function private.prevent_organization_id_change();
create trigger recurring_obligations_creator_immutable
before update on public.recurring_obligations
for each row execute function private.prevent_created_by_change();
create trigger forecast_runs_tenant_immutable
before update on public.forecast_runs
for each row execute function private.prevent_organization_id_change();
create trigger forecast_points_tenant_immutable
before update on public.forecast_points
for each row execute function private.prevent_organization_id_change();
create trigger forecast_points_link_immutable
before update on public.forecast_points
for each row execute function private.prevent_forecast_link_change();
create trigger liquidity_gaps_tenant_immutable
before update on public.liquidity_gaps
for each row execute function private.prevent_organization_id_change();
create trigger liquidity_gaps_link_immutable
before update on public.liquidity_gaps
for each row execute function private.prevent_forecast_link_change();
create trigger recommendations_tenant_immutable
before update on public.recommendations
for each row execute function private.prevent_organization_id_change();
create trigger recommendations_link_immutable
before update on public.recommendations
for each row execute function private.prevent_forecast_link_change();
create trigger audit_events_tenant_immutable
before update on public.audit_events
for each row execute function private.prevent_organization_id_change();

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.data_connections enable row level security;
alter table public.sync_runs enable row level security;
alter table public.bank_accounts enable row level security;
alter table public.bank_transactions enable row level security;
alter table public.cfdi_import_batches enable row level security;
alter table public.cfdi_invoices enable row level security;
alter table public.recurring_obligations enable row level security;
alter table public.forecast_runs enable row level security;
alter table public.forecast_points enable row level security;
alter table public.liquidity_gaps enable row level security;
alter table public.recommendations enable row level security;
alter table public.audit_events enable row level security;

revoke all on all tables in schema public from anon;
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;

create policy organizations_select_member on public.organizations
for select to authenticated
using (private.is_organization_member(id));

create policy organizations_insert_creator on public.organizations
for insert to authenticated
with check (created_by = (select auth.uid()));

create policy organizations_update_admin on public.organizations
for update to authenticated
using (private.is_organization_admin(id))
with check (private.is_organization_admin(id));

create policy organizations_delete_owner on public.organizations
for delete to authenticated
using (private.has_organization_role(id, array['owner']));

create policy organization_members_select_member on public.organization_members
for select to authenticated
using (user_id = (select auth.uid()) or private.is_organization_admin(organization_id));

create policy organization_members_insert_owner_or_admin on public.organization_members
for insert to authenticated
with check (
  private.is_organization_admin(organization_id)
  or (
    user_id = (select auth.uid())
    and role = 'owner'
    and private.is_organization_creator(organization_id)
  )
);

create policy organization_members_update_admin on public.organization_members
for update to authenticated
using (private.is_organization_admin(organization_id))
with check (private.is_organization_admin(organization_id));

create policy organization_members_delete_admin on public.organization_members
for delete to authenticated
using (private.is_organization_admin(organization_id));

create policy data_connections_member_select on public.data_connections
for select to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin', 'analyst']));
create policy data_connections_admin_insert on public.data_connections
for insert to authenticated
with check (private.is_organization_admin(organization_id) and created_by = (select auth.uid()));
create policy data_connections_admin_update on public.data_connections
for update to authenticated
using (private.is_organization_admin(organization_id))
with check (private.is_organization_admin(organization_id));

create policy sync_runs_member_select on public.sync_runs
for select to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin', 'analyst']));
create policy sync_runs_admin_insert on public.sync_runs
for insert to authenticated
with check (private.is_organization_admin(organization_id));
create policy sync_runs_admin_update on public.sync_runs
for update to authenticated
using (private.is_organization_admin(organization_id))
with check (private.is_organization_admin(organization_id));

create policy bank_accounts_member_select on public.bank_accounts
for select to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin', 'analyst']));
create policy bank_accounts_admin_insert on public.bank_accounts
for insert to authenticated
with check (private.is_organization_admin(organization_id));
create policy bank_accounts_admin_update on public.bank_accounts
for update to authenticated
using (private.is_organization_admin(organization_id))
with check (private.is_organization_admin(organization_id));

create policy bank_transactions_member_select on public.bank_transactions
for select to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin', 'analyst']));
create policy bank_transactions_admin_insert on public.bank_transactions
for insert to authenticated
with check (private.is_organization_admin(organization_id));
create policy bank_transactions_admin_update on public.bank_transactions
for update to authenticated
using (private.is_organization_admin(organization_id))
with check (private.is_organization_admin(organization_id));

create policy cfdi_batches_member_select on public.cfdi_import_batches
for select to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin', 'analyst']));
create policy cfdi_batches_admin_insert on public.cfdi_import_batches
for insert to authenticated
with check (private.is_organization_admin(organization_id) and imported_by = (select auth.uid()));

create policy cfdi_invoices_member_select on public.cfdi_invoices
for select to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin', 'analyst']));
create policy cfdi_invoices_admin_insert on public.cfdi_invoices
for insert to authenticated
with check (private.is_organization_admin(organization_id));
create policy cfdi_invoices_admin_update on public.cfdi_invoices
for update to authenticated
using (private.is_organization_admin(organization_id))
with check (private.is_organization_admin(organization_id));

create policy recurring_obligations_member_select on public.recurring_obligations
for select to authenticated
using (private.has_organization_role(organization_id, array['owner', 'admin', 'analyst']));
create policy recurring_obligations_admin_insert on public.recurring_obligations
for insert to authenticated
with check (private.is_organization_admin(organization_id) and created_by = (select auth.uid()));
create policy recurring_obligations_admin_update on public.recurring_obligations
for update to authenticated
using (private.is_organization_admin(organization_id))
with check (private.is_organization_admin(organization_id));

create policy forecast_runs_member_select on public.forecast_runs
for select to authenticated
using (private.is_organization_member(organization_id));
create policy forecast_runs_analyst_insert on public.forecast_runs
for insert to authenticated
with check (private.can_run_forecast(organization_id));
create policy forecast_runs_analyst_update on public.forecast_runs
for update to authenticated
using (private.can_run_forecast(organization_id))
with check (private.can_run_forecast(organization_id));

create policy forecast_points_member_select on public.forecast_points
for select to authenticated
using (private.is_organization_member(organization_id));
create policy forecast_points_analyst_insert on public.forecast_points
for insert to authenticated
with check (private.can_run_forecast(organization_id));

create policy liquidity_gaps_member_select on public.liquidity_gaps
for select to authenticated
using (private.is_organization_member(organization_id));
create policy liquidity_gaps_analyst_insert on public.liquidity_gaps
for insert to authenticated
with check (private.can_run_forecast(organization_id));
create policy liquidity_gaps_admin_update on public.liquidity_gaps
for update to authenticated
using (private.can_run_forecast(organization_id))
with check (private.can_run_forecast(organization_id));

create policy recommendations_member_select on public.recommendations
for select to authenticated
using (private.is_organization_member(organization_id));
create policy recommendations_analyst_insert on public.recommendations
for insert to authenticated
with check (private.can_run_forecast(organization_id));
create policy recommendations_member_update on public.recommendations
for update to authenticated
using (private.can_run_forecast(organization_id))
with check (private.can_run_forecast(organization_id));

create policy audit_events_admin_select on public.audit_events
for select to authenticated
using (organization_id is null or private.is_organization_admin(organization_id));
create policy audit_events_member_insert on public.audit_events
for insert to authenticated
with check (
  (organization_id is null or private.is_organization_member(organization_id))
  and actor_user_id = (select auth.uid())
);

grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.has_organization_role(uuid, text[]) to authenticated;
grant execute on function private.is_organization_admin(uuid) to authenticated;
grant execute on function private.can_run_forecast(uuid) to authenticated;
grant execute on function private.is_organization_creator(uuid) to authenticated;
