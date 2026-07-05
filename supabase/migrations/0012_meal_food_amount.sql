-- Lets each food link record how much of it to feed (e.g. "1/2 cup",
-- "3 oz"), shown alongside the name/photo on the meal's food chip.

alter table meal_foods add column amount text;
