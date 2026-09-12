create index organizations_created_by_idx
on public.organizations (created_by);

create index organization_members_invited_by_idx
on public.organization_members (invited_by);

create index data_connections_created_by_idx
on public.data_connections (created_by);

create index sync_runs_organization_idx
on public.sync_runs (organization_id);

create index cfdi_import_batches_imported_by_idx
on public.cfdi_import_batches (imported_by);

create index cfdi_invoices_import_batch_idx
on public.cfdi_invoices (import_batch_id);

create index recurring_obligations_organization_idx
on public.recurring_obligations (organization_id);

create index recurring_obligations_created_by_idx
on public.recurring_obligations (created_by);

create index forecast_points_organization_idx
on public.forecast_points (organization_id);

create index recommendations_forecast_run_idx
on public.recommendations (forecast_run_id);

create index recommendations_liquidity_gap_idx
on public.recommendations (liquidity_gap_id);

create index audit_events_actor_user_idx
on public.audit_events (actor_user_id);
