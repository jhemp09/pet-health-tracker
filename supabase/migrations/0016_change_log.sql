-- A per-pet change log: automatically records medication/food config
-- changes and bloodwork uploads (as vet visits), plus lets users add or
-- delete manual entries. Shown as a timeline on the Trends page.

create table change_log_entries (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  event_date date not null,
  category text not null check (category in ('medication', 'food', 'bloodwork', 'manual')),
  description text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index change_log_entries_pet_id_idx on change_log_entries(pet_id);
create index change_log_entries_event_date_idx on change_log_entries(event_date);

alter table change_log_entries enable row level security;

create policy change_log_entries_select on change_log_entries
  for select using (is_household_member(pet_household_id(pet_id)));
create policy change_log_entries_insert on change_log_entries
  for insert with check (is_household_member(pet_household_id(pet_id)));
create policy change_log_entries_delete on change_log_entries
  for delete using (is_household_member(pet_household_id(pet_id)));
