-- Redesign medications for per-time-slot logging, mirroring how
-- feeding_schedules/feeding_logs work: each medication can have multiple
-- daily times, and each time is its own loggable row (so a twice-daily
-- medication shows as two independently-trackable entries, not one).

create table medication_schedule_times (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  scheduled_time time not null,
  created_at timestamptz not null default now()
);

create index medication_schedule_times_medication_id_idx
  on medication_schedule_times(medication_id);

alter table medications drop column schedule_times;

-- Old medication_logs (scheduled_for/given_at) doesn't distinguish which
-- time slot a dose belongs to and has no data yet, so it's replaced outright.
drop table medication_logs;

create table medication_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  medication_id uuid not null references medications(id) on delete cascade,
  schedule_time_id uuid references medication_schedule_times(id) on delete set null,
  observed_date date not null,
  given boolean not null,
  notes text,
  logged_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (schedule_time_id, observed_date)
);

create index medication_logs_pet_id_idx on medication_logs(pet_id);
create index medication_logs_medication_id_idx on medication_logs(medication_id);
create index medication_logs_observed_date_idx on medication_logs(observed_date);

create or replace function public.medication_household_id(mid uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select pets.household_id
  from medications
  join pets on pets.id = medications.pet_id
  where medications.id = mid;
$$;

create or replace function public.schedule_time_household_id(stid uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select pets.household_id
  from medication_schedule_times
  join medications on medications.id = medication_schedule_times.medication_id
  join pets on pets.id = medications.pet_id
  where medication_schedule_times.id = stid;
$$;

alter table medication_schedule_times enable row level security;
alter table medication_logs enable row level security;

create policy medication_schedule_times_select on medication_schedule_times
  for select using (is_household_member(medication_household_id(medication_id)));
create policy medication_schedule_times_insert on medication_schedule_times
  for insert with check (is_household_member(medication_household_id(medication_id)));
create policy medication_schedule_times_update on medication_schedule_times
  for update using (is_household_member(medication_household_id(medication_id)));
create policy medication_schedule_times_delete on medication_schedule_times
  for delete using (is_household_member(medication_household_id(medication_id)));

create policy medication_logs_select on medication_logs
  for select using (is_household_member(pet_household_id(pet_id)));
create policy medication_logs_insert on medication_logs
  for insert with check (is_household_member(pet_household_id(pet_id)) and logged_by = auth.uid());
create policy medication_logs_update on medication_logs
  for update using (is_household_member(pet_household_id(pet_id)));
create policy medication_logs_delete on medication_logs
  for delete using (is_household_member(pet_household_id(pet_id)));
