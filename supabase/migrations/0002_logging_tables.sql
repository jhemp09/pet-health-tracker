-- Feeding, medication, weight, demeanor, bloodwork, and notification tables.
-- All scoped to a pet, which is scoped to a household.

create table feeding_schedules (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  label text not null,
  scheduled_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table feeding_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  schedule_id uuid references feeding_schedules(id) on delete set null,
  logged_by uuid not null references auth.users(id) on delete cascade,
  fed_at timestamptz not null default now(),
  percent_eaten int not null check (percent_eaten between 0 and 100),
  notes text,
  created_at timestamptz not null default now()
);

create table medications (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  name text not null,
  dosage text,
  schedule_times time[] not null default '{}',
  active boolean not null default true,
  start_date date,
  end_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table medication_logs (
  id uuid primary key default gen_random_uuid(),
  medication_id uuid not null references medications(id) on delete cascade,
  pet_id uuid not null references pets(id) on delete cascade,
  logged_by uuid not null references auth.users(id) on delete cascade,
  scheduled_for timestamptz,
  given boolean not null,
  given_at timestamptz not null default now(),
  notes text
);

create table weight_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  logged_by uuid not null references auth.users(id) on delete cascade,
  weight numeric not null check (weight > 0),
  unit text not null default 'lb' check (unit in ('lb', 'kg')),
  logged_at timestamptz not null default now(),
  notes text
);

create table demeanor_logs (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  logged_by uuid not null references auth.users(id) on delete cascade,
  logged_at timestamptz not null default now(),
  energy_level int check (energy_level between 1 and 5),
  vomiting boolean not null default false,
  vomiting_count int not null default 0,
  distancing boolean not null default false,
  notes text
);

create table bloodwork_files (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  file_type text not null check (file_type in ('image', 'pdf')),
  taken_at date,
  notes text,
  created_at timestamptz not null default now()
);

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pet_id uuid not null references pets(id) on delete cascade,
  feeding_enabled boolean not null default false,
  medication_enabled boolean not null default false,
  weight_enabled boolean not null default false,
  demeanor_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, pet_id)
);

create index feeding_schedules_pet_id_idx on feeding_schedules(pet_id);
create index feeding_logs_pet_id_idx on feeding_logs(pet_id);
create index feeding_logs_fed_at_idx on feeding_logs(fed_at);
create index medications_pet_id_idx on medications(pet_id);
create index medication_logs_pet_id_idx on medication_logs(pet_id);
create index medication_logs_medication_id_idx on medication_logs(medication_id);
create index weight_logs_pet_id_idx on weight_logs(pet_id);
create index weight_logs_logged_at_idx on weight_logs(logged_at);
create index demeanor_logs_pet_id_idx on demeanor_logs(pet_id);
create index demeanor_logs_logged_at_idx on demeanor_logs(logged_at);
create index bloodwork_files_pet_id_idx on bloodwork_files(pet_id);
create index push_subscriptions_user_id_idx on push_subscriptions(user_id);
create index notification_preferences_pet_id_idx on notification_preferences(pet_id);
