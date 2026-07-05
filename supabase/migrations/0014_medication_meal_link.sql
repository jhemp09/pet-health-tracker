-- Lets a medication be linked to the meal it should be given with, so the
-- Food and Medications tabs can cross-link ("this meal has medicine in it" /
-- "this medicine goes in this meal").

alter table medications
  add column linked_schedule_id uuid references feeding_schedules(id) on delete set null;

create index medications_linked_schedule_id_idx on medications(linked_schedule_id);
