alter table public.treasury_decisions add constraint treasury_decisions_idempotency unique (organization_id, input_hash, plan_id);

-- Financial snapshots are immutable; only follow-up changes. Audit in the same transaction.
create function private.audit_treasury_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  insert into public.audit_events (organization_id, actor_user_id, action, resource_type, resource_id)
  values (new.organization_id, auth.uid(), case when tg_op = 'INSERT' then 'treasury.plan_selected' else 'treasury.followup_updated' end, 'treasury_decision', new.id);
  return new;
end;
$$;
revoke all on function private.audit_treasury_change() from public;
create trigger audit_treasury_decisions after insert or update on public.treasury_decisions
  for each row execute function private.audit_treasury_change();

create function private.audit_invoice_planning_change() returns trigger
language plpgsql security invoker set search_path = '' as $$
begin
  if new.due_on is distinct from old.due_on or new.outstanding_amount is distinct from old.outstanding_amount or new.metadata is distinct from old.metadata then
    insert into public.audit_events (organization_id, actor_user_id, action, resource_type, resource_id)
    values (new.organization_id, auth.uid(), 'cfdi.planning_updated', 'cfdi_invoice', new.id);
  end if;
  return new;
end;
$$;
revoke all on function private.audit_invoice_planning_change() from public;
create trigger audit_cfdi_planning after update on public.cfdi_invoices
  for each row execute function private.audit_invoice_planning_change();
