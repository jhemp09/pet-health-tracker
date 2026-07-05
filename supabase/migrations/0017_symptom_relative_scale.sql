-- Vocalizations used to be a free-text enum ("Normal", "More than normal",
-- "Less than normal"). It's now the same numeric 1-5 "relative to normal"
-- scale as the other symptoms, so convert existing rows using the clean
-- 1:1 mapping rather than losing that history.

update demeanor_observations
set
  value_numeric = case value_text
    when 'Less than normal' then 2
    when 'Normal' then 3
    when 'More than normal' then 4
    else value_numeric
  end,
  value_text = null
where symptom_key = 'vocalizations' and value_text is not null;
