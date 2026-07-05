-- Correction: a medication can have multiple daily times (e.g. AM/PM), and
-- each time may need to link to a DIFFERENT meal (e.g. AM dose with
-- breakfast, PM dose with dinner). Move the link from the medication
-- itself down to each medication_schedule_times row.

alter table medications drop column if exists linked_schedule_id;

alter table medication_schedule_times
  add column linked_schedule_id uuid references feeding_schedules(id) on delete set null;

create index medication_schedule_times_linked_schedule_id_idx
  on medication_schedule_times(linked_schedule_id);
