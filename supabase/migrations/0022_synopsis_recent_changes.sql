-- Adds a "recent changes" section to the AI-generated synopsis, called out
-- separately from the longer-period trend so anything from roughly the
-- past week stands out on its own.

alter table pet_synopses
  add column recent_changes text not null default '';
