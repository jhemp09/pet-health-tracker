-- Row Level Security: every table is scoped to household membership, so one
-- household's pet data is never visible to another household.

alter table households enable row level security;
alter table household_members enable row level security;
alter table household_invites enable row level security;
alter table pets enable row level security;
alter table feeding_schedules enable row level security;
alter table feeding_logs enable row level security;
alter table medications enable row level security;
alter table medication_logs enable row level security;
alter table weight_logs enable row level security;
alter table demeanor_logs enable row level security;
alter table bloodwork_files enable row level security;
alter table push_subscriptions enable row level security;
alter table notification_preferences enable row level security;

-- households
-- (insert happens only via create_household(); no direct insert policy)
create policy households_select on households
  for select using (is_household_member(id));
create policy households_update on households
  for update using (is_household_owner(id));
create policy households_delete on households
  for delete using (is_household_owner(id));

-- household_members
-- (insert happens only via create_household() / join_household_with_code())
create policy household_members_select on household_members
  for select using (is_household_member(household_id));
create policy household_members_update on household_members
  for update using (is_household_owner(household_id));
create policy household_members_delete on household_members
  for delete using (is_household_owner(household_id) or user_id = auth.uid());

-- household_invites
-- (insert/join happen only via the RPCs, which run as security definer)
create policy household_invites_select on household_invites
  for select using (is_household_member(household_id));
create policy household_invites_delete on household_invites
  for delete using (is_household_member(household_id));

-- pets
create policy pets_select on pets
  for select using (is_household_member(household_id));
create policy pets_insert on pets
  for insert with check (is_household_member(household_id));
create policy pets_update on pets
  for update using (is_household_member(household_id));
create policy pets_delete on pets
  for delete using (is_household_member(household_id));

-- feeding_schedules
create policy feeding_schedules_select on feeding_schedules
  for select using (is_household_member(pet_household_id(pet_id)));
create policy feeding_schedules_insert on feeding_schedules
  for insert with check (is_household_member(pet_household_id(pet_id)));
create policy feeding_schedules_update on feeding_schedules
  for update using (is_household_member(pet_household_id(pet_id)));
create policy feeding_schedules_delete on feeding_schedules
  for delete using (is_household_member(pet_household_id(pet_id)));

-- feeding_logs
create policy feeding_logs_select on feeding_logs
  for select using (is_household_member(pet_household_id(pet_id)));
create policy feeding_logs_insert on feeding_logs
  for insert with check (is_household_member(pet_household_id(pet_id)) and logged_by = auth.uid());
create policy feeding_logs_update on feeding_logs
  for update using (is_household_member(pet_household_id(pet_id)));
create policy feeding_logs_delete on feeding_logs
  for delete using (is_household_member(pet_household_id(pet_id)));

-- medications
create policy medications_select on medications
  for select using (is_household_member(pet_household_id(pet_id)));
create policy medications_insert on medications
  for insert with check (is_household_member(pet_household_id(pet_id)));
create policy medications_update on medications
  for update using (is_household_member(pet_household_id(pet_id)));
create policy medications_delete on medications
  for delete using (is_household_member(pet_household_id(pet_id)));

-- medication_logs
create policy medication_logs_select on medication_logs
  for select using (is_household_member(pet_household_id(pet_id)));
create policy medication_logs_insert on medication_logs
  for insert with check (is_household_member(pet_household_id(pet_id)) and logged_by = auth.uid());
create policy medication_logs_update on medication_logs
  for update using (is_household_member(pet_household_id(pet_id)));
create policy medication_logs_delete on medication_logs
  for delete using (is_household_member(pet_household_id(pet_id)));

-- weight_logs
create policy weight_logs_select on weight_logs
  for select using (is_household_member(pet_household_id(pet_id)));
create policy weight_logs_insert on weight_logs
  for insert with check (is_household_member(pet_household_id(pet_id)) and logged_by = auth.uid());
create policy weight_logs_update on weight_logs
  for update using (is_household_member(pet_household_id(pet_id)));
create policy weight_logs_delete on weight_logs
  for delete using (is_household_member(pet_household_id(pet_id)));

-- demeanor_logs
create policy demeanor_logs_select on demeanor_logs
  for select using (is_household_member(pet_household_id(pet_id)));
create policy demeanor_logs_insert on demeanor_logs
  for insert with check (is_household_member(pet_household_id(pet_id)) and logged_by = auth.uid());
create policy demeanor_logs_update on demeanor_logs
  for update using (is_household_member(pet_household_id(pet_id)));
create policy demeanor_logs_delete on demeanor_logs
  for delete using (is_household_member(pet_household_id(pet_id)));

-- bloodwork_files
create policy bloodwork_files_select on bloodwork_files
  for select using (is_household_member(pet_household_id(pet_id)));
create policy bloodwork_files_insert on bloodwork_files
  for insert with check (is_household_member(pet_household_id(pet_id)) and uploaded_by = auth.uid());
create policy bloodwork_files_update on bloodwork_files
  for update using (is_household_member(pet_household_id(pet_id)));
create policy bloodwork_files_delete on bloodwork_files
  for delete using (is_household_member(pet_household_id(pet_id)));

-- push_subscriptions: strictly private to the owning user, not household-shared
create policy push_subscriptions_all on push_subscriptions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notification_preferences: each user manages their own reminder settings,
-- but only for pets in a household they belong to
create policy notification_preferences_select on notification_preferences
  for select using (user_id = auth.uid());
create policy notification_preferences_insert on notification_preferences
  for insert with check (user_id = auth.uid() and is_household_member(pet_household_id(pet_id)));
create policy notification_preferences_update on notification_preferences
  for update using (user_id = auth.uid());
create policy notification_preferences_delete on notification_preferences
  for delete using (user_id = auth.uid());

-- Storage: private bucket for bloodwork uploads, one folder per household
-- (object path convention: <household_id>/<pet_id>/<filename>)
insert into storage.buckets (id, name, public)
values ('bloodwork', 'bloodwork', false)
on conflict (id) do nothing;

create policy bloodwork_storage_select on storage.objects
  for select using (
    bucket_id = 'bloodwork'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );
create policy bloodwork_storage_insert on storage.objects
  for insert with check (
    bucket_id = 'bloodwork'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );
create policy bloodwork_storage_delete on storage.objects
  for delete using (
    bucket_id = 'bloodwork'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );
