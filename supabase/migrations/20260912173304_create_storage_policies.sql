insert into storage.buckets (id, name, public)
values ('cfdi-documents', 'cfdi-documents', false)
on conflict (id) do update
set public = excluded.public;

create policy cfdi_documents_member_select on storage.objects
for select to authenticated
using (
  bucket_id = 'cfdi-documents'
  and exists (
    select 1
    from public.organization_members member
    where member.organization_id::text = (storage.foldername(name))[1]
      and member.user_id = (select auth.uid())
      and member.status = 'active'
  )
);

create policy cfdi_documents_admin_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'cfdi-documents'
  and exists (
    select 1
    from public.organization_members member
    where member.organization_id::text = (storage.foldername(name))[1]
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  )
);

create policy cfdi_documents_admin_update on storage.objects
for update to authenticated
using (
  bucket_id = 'cfdi-documents'
  and exists (
    select 1
    from public.organization_members member
    where member.organization_id::text = (storage.foldername(name))[1]
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  )
)
with check (
  bucket_id = 'cfdi-documents'
  and exists (
    select 1
    from public.organization_members member
    where member.organization_id::text = (storage.foldername(name))[1]
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  )
);

create policy cfdi_documents_admin_delete on storage.objects
for delete to authenticated
using (
  bucket_id = 'cfdi-documents'
  and exists (
    select 1
    from public.organization_members member
    where member.organization_id::text = (storage.foldername(name))[1]
      and member.user_id = (select auth.uid())
      and member.status = 'active'
      and member.role in ('owner', 'admin')
  )
);
