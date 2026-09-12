begin;

select plan(11);

insert into auth.users (id, email, email_confirmed_at)
values
  ('00000000-0000-0000-0000-000000000001', 'owner@example.test', now()),
  ('00000000-0000-0000-0000-000000000002', 'viewer@example.test', now()),
  ('00000000-0000-0000-0000-000000000003', 'outsider@example.test', now())
on conflict (id) do nothing;

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000001',
  true
);

select lives_ok(
  $$
    insert into public.organizations (id, name, created_by)
    values (
      '10000000-0000-0000-0000-000000000001',
      'Owner organization',
      '00000000-0000-0000-0000-000000000001'
    )
  $$,
  'owner can create an organization'
);

select lives_ok(
  $$
    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      status,
      joined_at
    )
    values (
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000001',
      'owner',
      'active',
      now()
    )
  $$,
  'owner can create the initial membership'
);

select lives_ok(
  $$
    insert into public.data_connections (
      id,
      organization_id,
      kind,
      provider,
      display_name,
      created_by
    )
    values (
      '20000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      'bank',
      'nessie',
      'Nessie demo',
      '00000000-0000-0000-0000-000000000001'
    )
  $$,
  'owner can create a bank connection'
);

select lives_ok(
  $$
    insert into public.bank_accounts (
      id,
      organization_id,
      connection_id,
      external_id,
      name,
      type,
      currency,
      balance
    )
    values (
      '30000000-0000-0000-0000-000000000001',
      '10000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001',
      'external-account-1',
      'Operating account',
      'Checking',
      'USD',
      1000
    )
  $$,
  'owner can create bank data'
);

select lives_ok(
  $$
    insert into public.organization_members (
      organization_id,
      user_id,
      role,
      status,
      joined_at
    )
    values (
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002',
      'viewer',
      'active',
      now()
    )
  $$,
  'owner can add a viewer'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000003',
  true
);

select is(
  (select count(*) from public.organizations),
  0::bigint,
  'outsider cannot see another organization'
);

select is(
  (select count(*) from public.bank_accounts),
  0::bigint,
  'outsider cannot see another organization bank data'
);

select set_config(
  'request.jwt.claim.sub',
  '00000000-0000-0000-0000-000000000002',
  true
);

select is(
  (select count(*) from public.organizations),
  1::bigint,
  'active viewer can see the organization shell'
);

select is(
  (select count(*) from public.bank_accounts),
  0::bigint,
  'viewer cannot see raw bank accounts'
);

select throws_ok(
  $$
    insert into public.bank_accounts (
      organization_id,
      connection_id,
      external_id,
      name,
      type,
      currency,
      balance
    )
    values (
      '10000000-0000-0000-0000-000000000001',
      '20000000-0000-0000-0000-000000000001',
      'viewer-write',
      'Forbidden',
      'Checking',
      'USD',
      1
    )
  $$,
  '42501',
  null::text,
  'viewer cannot insert bank accounts'
);

set local role postgres;

select is(
  (select count(*) from storage.buckets where id = 'cfdi-documents' and not public),
  1::bigint,
  'CFDI storage bucket is private'
);

select * from finish();
rollback;
