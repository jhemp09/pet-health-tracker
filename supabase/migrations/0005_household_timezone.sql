-- Households need a timezone so scheduled reminders (feeding times, med
-- times) fire at the household's local wall-clock time rather than UTC.

alter table households
  add column timezone text not null default 'UTC';

create or replace function public.create_household(
  household_name text,
  member_display_name text default null,
  household_timezone text default 'UTC'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_household_id uuid;
begin
  insert into households (name, created_by, timezone)
  values (household_name, auth.uid(), household_timezone)
  returning id into new_household_id;

  insert into household_members (household_id, user_id, role, display_name)
  values (new_household_id, auth.uid(), 'owner', member_display_name);

  return new_household_id;
end;
$$;
