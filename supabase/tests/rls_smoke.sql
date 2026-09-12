begin;

select plan(6);

select ok(
  to_regclass('public.organizations') is not null,
  'organizations table exists'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.organizations'::regclass
  ),
  'organizations has RLS enabled'
);

select ok(
  (
    select count(*)
    from pg_class relation
    join pg_namespace namespace on namespace.oid = relation.relnamespace
    where namespace.nspname = 'public'
      and relation.relname in (
        'organizations',
        'organization_members',
        'data_connections',
        'sync_runs',
        'bank_accounts',
        'bank_transactions',
        'cfdi_import_batches',
        'cfdi_invoices',
        'recurring_obligations',
        'forecast_runs',
        'forecast_points',
        'liquidity_gaps',
        'recommendations',
        'audit_events'
      )
      and relation.relrowsecurity
  ) = 14,
  'all application tables have RLS enabled'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'organizations'
      and policyname = 'organizations_insert_creator'
  ),
  'organizations only accepts creator-owned inserts'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'bank_transactions'
      and policyname = 'bank_transactions_member_select'
  ),
  'bank transactions expose a member-only read policy'
);

select ok(
  exists (
    select 1
    from storage.buckets
    where id = 'cfdi-documents'
      and public = false
  ),
  'CFDI storage bucket is private'
);

select * from finish();
rollback;
