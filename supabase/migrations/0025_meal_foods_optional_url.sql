-- Product link is no longer required when adding food details — some
-- foods (homemade meals, unlinkable products) don't have a URL to attach.

alter table meal_foods alter column url drop not null;
