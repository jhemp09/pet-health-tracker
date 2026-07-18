-- Lets a weight log be auto-populated from a bloodwork upload (many lab
-- reports include the patient's weight). The link back to the source file
-- lets a re-parse/retry replace its own weight entry instead of duplicating.

alter table weight_logs
  add column bloodwork_file_id uuid references bloodwork_files(id) on delete cascade;

create index weight_logs_bloodwork_file_id_idx on weight_logs(bloodwork_file_id);
