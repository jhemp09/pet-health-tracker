-- Lets a medication be scheduled every N days instead of only daily
-- (e.g. every 2 or 3 days). `start_date` already existed on medications
-- but was unused; it now serves as the anchor day that interval counting
-- is measured from.

alter table medications
  add column interval_days integer not null default 1
    check (interval_days >= 1);
