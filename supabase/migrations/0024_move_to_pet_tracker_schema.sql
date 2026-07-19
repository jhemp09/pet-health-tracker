-- Moves every table and helper/RPC function belonging to this app out of
-- the shared "public" schema and into a dedicated "pet_tracker" schema, so
-- this Supabase project can host other apps side by side later without
-- name collisions, and so it's obvious at a glance which tables belong to
-- this app.
--
-- IMPORTANT — running this SQL alone will break the live app. Two more
-- things have to happen right around the same time:
--   1. In the Supabase dashboard: Project Settings -> Data API -> "Exposed
--      schemas" -> add "pet_tracker" to the list. Do this BEFORE running
--      this script (it's harmless on its own — "public" still has
--      everything until this script runs).
--   2. Deploy the app code that points the Supabase client at the
--      "pet_tracker" schema, immediately after running this script.
-- Between step 2 (this script) and the code deploy, the live app will not
-- be able to reach any of its data, since Postgres schema membership alone
-- doesn't change what the REST API serves. Keep that window as short as
-- possible — have the new code ready to deploy before you run this.

create schema if not exists pet_tracker;

-- 1. Move every table.
do $$
declare
  tbl text;
  tables text[] := array[
    'households', 'household_members', 'household_invites', 'pets',
    'feeding_schedules', 'feeding_logs', 'meal_foods',
    'medications', 'medication_schedule_times', 'medication_logs',
    'weight_logs', 'demeanor_logs', 'pet_demeanor_symptoms', 'demeanor_observations',
    'bloodwork_files', 'bloodwork_results',
    'change_log_entries', 'pet_synopses', 'pet_diagnoses',
    'push_subscriptions', 'notification_preferences'
  ];
begin
  foreach tbl in array tables loop
    if exists (select 1 from pg_tables where schemaname = 'public' and tablename = tbl) then
      execute format('alter table public.%I set schema pet_tracker', tbl);
    end if;
  end loop;
end $$;

-- 2. Move every helper/RPC function (every overload of each name, found
-- dynamically so this doesn't depend on guessing exact argument lists),
-- and repoint each one's pinned search_path at the new schema so their own
-- unqualified table references keep resolving correctly. RLS policies and
-- foreign keys that reference these by name are bound to the underlying
-- object OIDs, not schema-qualified names, so moving them here does not
-- break any existing policy, storage policy, or constraint that calls them.
do $$
declare
  fn record;
  fn_names text[] := array[
    'is_household_member', 'is_household_owner', 'pet_household_id',
    'create_household', 'create_household_invite', 'join_household_with_code',
    'medication_household_id', 'schedule_time_household_id',
    'schedule_household_id', 'bloodwork_file_household_id'
  ];
begin
  for fn in
    select p.proname, pg_get_function_identity_arguments(p.oid) as args
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = any(fn_names)
  loop
    execute format('alter function public.%I(%s) set schema pet_tracker', fn.proname, fn.args);
    execute format('alter function pet_tracker.%I(%s) set search_path = pet_tracker', fn.proname, fn.args);
  end loop;
end $$;

-- 3. Grant the new schema the same access Supabase's standard roles have
-- on "public" by default. Table/function-level grants already on these
-- specific objects carry over automatically when they move schema, but
-- schema-level USAGE and default privileges for anything created here in
-- the future do not — a brand-new schema starts with none of that.
grant usage on schema pet_tracker to anon, authenticated, service_role;
grant all on all tables in schema pet_tracker to anon, authenticated, service_role;
grant all on all sequences in schema pet_tracker to anon, authenticated, service_role;
grant all on all functions in schema pet_tracker to anon, authenticated, service_role;
alter default privileges in schema pet_tracker grant all on tables to anon, authenticated, service_role;
alter default privileges in schema pet_tracker grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema pet_tracker grant all on functions to anon, authenticated, service_role;
