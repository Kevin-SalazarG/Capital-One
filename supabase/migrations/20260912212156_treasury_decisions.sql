-- Additive migration: existing organizations and financial history are preserved.
alter table public.organizations add column daily_operating_expense numeric(19,4) not null default 0 check (daily_operating_expense >= 0);
alter table public.recurring_obligations drop constraint recurring_obligations_frequency_check;
alter table public.recurring_obligations add constraint recurring_obligations_frequency_check check (frequency in ('weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'));

create table public.treasury_decisions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  input_hash text not null check (length(input_hash) = 64),
  plan_id text not null,
  plan jsonb not null check (jsonb_typeof(plan) = 'object'),
  steps jsonb not null default '{}'::jsonb check (jsonb_typeof(steps) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index treasury_decisions_org_latest on public.treasury_decisions (organization_id, created_at desc);
create index treasury_decisions_creator on public.treasury_decisions (created_by);
alter table public.treasury_decisions enable row level security;
revoke all on public.treasury_decisions from anon, authenticated;
grant select, insert on public.treasury_decisions to authenticated;
grant update (steps, updated_at) on public.treasury_decisions to authenticated;
grant all on public.treasury_decisions to service_role;
create policy treasury_decisions_read on public.treasury_decisions for select to authenticated
  using (private.is_organization_member(organization_id));
create policy treasury_decisions_insert on public.treasury_decisions for insert to authenticated
  with check (private.can_run_forecast(organization_id) and created_by = (select auth.uid()));
create policy treasury_decisions_update on public.treasury_decisions for update to authenticated
  using (private.can_run_forecast(organization_id)) with check (private.can_run_forecast(organization_id));

-- Completing an authorized CFDI import requires an UPDATE policy as well as SELECT.
create policy cfdi_batches_admin_update on public.cfdi_import_batches for update to authenticated
  using (private.is_organization_admin(organization_id)) with check (private.is_organization_admin(organization_id));
