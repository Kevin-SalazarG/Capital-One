begin;
select plan(12);
insert into auth.users (id, email) values
 ('90000000-0000-0000-0000-000000000001','treasury-owner@example.test'),
 ('90000000-0000-0000-0000-000000000002','treasury-viewer@example.test'),
 ('90000000-0000-0000-0000-000000000003','treasury-outsider@example.test');
insert into public.organizations (id,name,created_by) values ('91000000-0000-0000-0000-000000000001','Treasury RLS test','90000000-0000-0000-0000-000000000001');
insert into public.organization_members (organization_id,user_id,role,status) values
 ('91000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000001','owner','active'),
 ('91000000-0000-0000-0000-000000000001','90000000-0000-0000-0000-000000000002','viewer','active');
set local role authenticated;
select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000001',true);
select lives_ok($$insert into public.treasury_decisions (id,organization_id,input_hash,plan_id,plan,created_by) values ('92000000-0000-0000-0000-000000000001','91000000-0000-0000-0000-000000000001',repeat('a',64),'test','{}','90000000-0000-0000-0000-000000000001')$$,'owner can save a decision');
select is((select count(*) from public.treasury_decisions where id='92000000-0000-0000-0000-000000000001'),1::bigint,'owner reads own decision');
select lives_ok($$update public.treasury_decisions set steps='{"one":"agreed"}' where id='92000000-0000-0000-0000-000000000001'$$,'owner updates follow-up');
select is((select steps->>'one' from public.treasury_decisions where id='92000000-0000-0000-0000-000000000001'),'agreed','follow-up persisted');
select throws_ok($$update public.treasury_decisions set plan='{"forged":true}' where id='92000000-0000-0000-0000-000000000001'$$,'42501',null,'saved financial snapshot cannot be rewritten');
select throws_ok($$delete from public.treasury_decisions where id='92000000-0000-0000-0000-000000000001'$$,'42501',null,'history cannot be deleted by client');
select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000003',true);
select is((select count(*) from public.treasury_decisions where id='92000000-0000-0000-0000-000000000001'),0::bigint,'outsider cannot read decision');
select throws_ok($$insert into public.treasury_decisions (organization_id,input_hash,plan_id,plan,created_by) values ('91000000-0000-0000-0000-000000000001',repeat('b',64),'test','{}','90000000-0000-0000-0000-000000000003')$$,'42501',null,'outsider cannot write decision');
select set_config('request.jwt.claim.sub','90000000-0000-0000-0000-000000000002',true);
select is((select count(*) from public.treasury_decisions where id='92000000-0000-0000-0000-000000000001'),1::bigint,'viewer can read saved decision');
with changed as (update public.treasury_decisions set steps='{}' where id='92000000-0000-0000-0000-000000000001' returning id) select is((select count(*) from changed),0::bigint,'viewer cannot update follow-up');
select throws_ok($$insert into public.treasury_decisions (organization_id,input_hash,plan_id,plan,created_by) values ('91000000-0000-0000-0000-000000000001',repeat('c',64),'test','{}','90000000-0000-0000-0000-000000000002')$$,'42501',null,'viewer cannot choose a plan');
set local role anon;
select throws_ok($$select * from public.treasury_decisions$$,'42501',null,'anonymous role has no access');
reset role;
select * from finish();
rollback;
