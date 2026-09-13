-- Selecting a previously saved plan must make it current without losing its steps.
alter table public.treasury_decisions
  add column selected_at timestamptz not null default now();

update public.treasury_decisions set selected_at = created_at;

create index treasury_decisions_selection_idx
  on public.treasury_decisions (organization_id, selected_at desc, id);

grant update (selected_at) on public.treasury_decisions to authenticated;
