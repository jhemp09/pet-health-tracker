-- Lets each medication record a product link (dosage and notes/"how to
-- give it" already exist as columns, just not surfaced in the daily
-- logging view yet).

alter table medications add column product_url text;
