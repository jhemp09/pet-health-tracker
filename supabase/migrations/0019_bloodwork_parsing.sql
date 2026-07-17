-- Adds AI-parsed lab results for bloodwork uploads. Each file gets a
-- status/summary, and its individual test values live in their own table
-- so they can be listed/queried per file.

alter table bloodwork_files
  add column mime_type text,
  add column parse_status text not null default 'pending' check (parse_status in ('pending', 'done', 'failed')),
  add column parsed_summary text,
  add column parsed_at timestamptz;

create table bloodwork_results (
  id uuid primary key default gen_random_uuid(),
  bloodwork_file_id uuid not null references bloodwork_files(id) on delete cascade,
  test_name text not null,
  value text not null,
  unit text,
  reference_range text,
  flag text check (flag in ('low', 'high', 'normal', 'abnormal')),
  created_at timestamptz not null default now()
);

create index bloodwork_results_bloodwork_file_id_idx on bloodwork_results(bloodwork_file_id);

create or replace function public.bloodwork_file_household_id(bfid uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select pets.household_id
  from bloodwork_files
  join pets on pets.id = bloodwork_files.pet_id
  where bloodwork_files.id = bfid;
$$;

alter table bloodwork_results enable row level security;

create policy bloodwork_results_select on bloodwork_results
  for select using (is_household_member(bloodwork_file_household_id(bloodwork_file_id)));
create policy bloodwork_results_insert on bloodwork_results
  for insert with check (is_household_member(bloodwork_file_household_id(bloodwork_file_id)));
create policy bloodwork_results_delete on bloodwork_results
  for delete using (is_household_member(bloodwork_file_household_id(bloodwork_file_id)));
