-- Lets an owner record standing diagnoses (picked from a species-specific
-- list) plus free-text medical notes for a pet, shown at the top of the
-- Medical page and fed into the AI synopsis as context instead of a
-- hardcoded, pet-specific assumption.

create table pet_diagnoses (
  id uuid primary key default gen_random_uuid(),
  pet_id uuid not null references pets(id) on delete cascade,
  diagnosis text not null default '',
  created_at timestamptz not null default now()
);

create index pet_diagnoses_pet_id_idx on pet_diagnoses(pet_id);

alter table pet_diagnoses enable row level security;

create policy pet_diagnoses_select on pet_diagnoses
  for select using (is_household_member(pet_household_id(pet_id)));
create policy pet_diagnoses_insert on pet_diagnoses
  for insert with check (is_household_member(pet_household_id(pet_id)));
create policy pet_diagnoses_update on pet_diagnoses
  for update using (is_household_member(pet_household_id(pet_id)));
create policy pet_diagnoses_delete on pet_diagnoses
  for delete using (is_household_member(pet_household_id(pet_id)));

alter table pets add column medical_notes text;
