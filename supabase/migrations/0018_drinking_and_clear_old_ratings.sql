-- Lethargy/Panting/Distancing used to be logged on a free 1-10 rating;
-- now that they're on the 1-5 "relative to normal" scale, those old
-- values aren't comparable, so clear them per user request (re-entered
-- going forward on the new scale). Vomiting/Vocalizations and any other
-- symptom's history is untouched.

delete from demeanor_observations
where symptom_key in ('lethargy', 'panting', 'distancing');
