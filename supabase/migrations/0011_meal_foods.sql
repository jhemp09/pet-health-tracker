-- Product links attached to a recurring meal (feeding_schedules), so each
-- meal can show what food(s) it uses (with a scraped name/image) and link
-- straight to the reorder page. A meal can have multiple foods (e.g. kibble
-- plus a topper), so this is a one-to-many child table rather than columns
-- on feeding_schedules.

create table meal_foods (
  id uuid primary key default gen_random_uuid(),
  schedule_id uuid not null references feeding_schedules(id) on delete cascade,
  url text not null,
  title text,
  image_url text,
  created_at timestamptz not null default now()
);

create index meal_foods_schedule_id_idx on meal_foods(schedule_id);

create or replace function public.schedule_household_id(sid uuid)
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select pets.household_id
  from feeding_schedules
  join pets on pets.id = feeding_schedules.pet_id
  where feeding_schedules.id = sid;
$$;

alter table meal_foods enable row level security;

create policy meal_foods_select on meal_foods
  for select using (is_household_member(schedule_household_id(schedule_id)));
create policy meal_foods_insert on meal_foods
  for insert with check (is_household_member(schedule_household_id(schedule_id)));
create policy meal_foods_update on meal_foods
  for update using (is_household_member(schedule_household_id(schedule_id)));
create policy meal_foods_delete on meal_foods
  for delete using (is_household_member(schedule_household_id(schedule_id)));
