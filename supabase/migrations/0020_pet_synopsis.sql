-- Stores the latest AI-generated health synopsis for a pet (current state,
-- trend, prognosis, suggestions), shown on the Trends page's Synopsis tab.
-- One row per pet — regenerating replaces it rather than keeping history.

create table pet_synopses (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade unique,
  current_state text not null,
  trend text not null,
  prognosis text not null,
  suggestions text[] not null default '{}',
  generated_at timestamptz not null default now()
);

create index pet_synopses_pet_id_idx on pet_synopses(pet_id);

alter table pet_synopses enable row level security;

create policy pet_synopses_select on pet_synopses
  for select using (is_household_member(pet_household_id(pet_id)));
create policy pet_synopses_insert on pet_synopses
  for insert with check (is_household_member(pet_household_id(pet_id)));
create policy pet_synopses_update on pet_synopses
  for update using (is_household_member(pet_household_id(pet_id)));
create policy pet_synopses_delete on pet_synopses
  for delete using (is_household_member(pet_household_id(pet_id)));
