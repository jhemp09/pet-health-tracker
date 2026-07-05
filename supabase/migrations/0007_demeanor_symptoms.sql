-- Replace the fixed-column demeanor_logs table with a configurable
-- checklist model: each pet selects which symptoms it tracks (from a
-- fixed catalog defined in the app), and each tracked symptom gets its own
-- observation per day, similar to how feeding_schedules/feeding_logs work.
-- symptom_key values (e.g. "vomiting_count", "lethargy", "panting",
-- "distancing", "vocalizations") are defined in src/lib/symptoms.ts, not
-- in the database, since the scale/label/options for each is app logic.

drop table demeanor_logs;

create table pet_demeanor_symptoms (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  symptom_key text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (pet_id, symptom_key)
);

create table demeanor_observations (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  symptom_key text not null,
  observed_date date not null,
  value_numeric numeric,
  value_text text,
  notes text,
  logged_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (pet_id, symptom_key, observed_date)
);

create index pet_demeanor_symptoms_pet_id_idx on pet_demeanor_symptoms(pet_id);
create index demeanor_observations_pet_id_idx on demeanor_observations(pet_id);
create index demeanor_observations_observed_date_idx on demeanor_observations(observed_date);

alter table pet_demeanor_symptoms enable row level security;
alter table demeanor_observations enable row level security;

create policy pet_demeanor_symptoms_select on pet_demeanor_symptoms
  for select using (is_household_member(pet_household_id(pet_id)));
create policy pet_demeanor_symptoms_insert on pet_demeanor_symptoms
  for insert with check (is_household_member(pet_household_id(pet_id)));
create policy pet_demeanor_symptoms_update on pet_demeanor_symptoms
  for update using (is_household_member(pet_household_id(pet_id)));
create policy pet_demeanor_symptoms_delete on pet_demeanor_symptoms
  for delete using (is_household_member(pet_household_id(pet_id)));

create policy demeanor_observations_select on demeanor_observations
  for select using (is_household_member(pet_household_id(pet_id)));
create policy demeanor_observations_insert on demeanor_observations
  for insert with check (is_household_member(pet_household_id(pet_id)) and logged_by = auth.uid());
create policy demeanor_observations_update on demeanor_observations
  for update using (is_household_member(pet_household_id(pet_id)));
create policy demeanor_observations_delete on demeanor_observations
  for delete using (is_household_member(pet_household_id(pet_id)));
