-- The database, not the API host's clock, orders selections and revisions.
create function private.stamp_treasury_selection() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  new.selected_at = clock_timestamp();
  return new;
end;
$$;
revoke all on function private.stamp_treasury_selection() from public;

create trigger treasury_selection_timestamp before update of selected_at
  on public.treasury_decisions for each row
  execute function private.stamp_treasury_selection();

create trigger treasury_decisions_set_updated_at before update
  on public.treasury_decisions for each row
  execute function private.set_updated_at();

create or replace function private.audit_treasury_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.audit_events (organization_id, actor_user_id, action, resource_type, resource_id)
  values (
    new.organization_id,
    auth.uid(),
    case when tg_op = 'INSERT' or new.selected_at is distinct from old.selected_at
      then 'treasury.plan_selected' else 'treasury.followup_updated' end,
    'treasury_decision', new.id
  );
  return new;
end;
$$;
