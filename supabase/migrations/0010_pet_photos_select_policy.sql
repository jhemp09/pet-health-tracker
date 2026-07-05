-- Fixes "new row violates row-level security policy" on the SECOND photo
-- upload for the same pet. Public buckets skip RLS for reads via the
-- public URL endpoint, but the upload endpoint's internal upsert (used when
-- re-uploading to an already-existing path) still needs a SELECT policy to
-- resolve the ON CONFLICT DO UPDATE against the existing row — without one,
-- Postgres can't establish visibility into the row it's supposed to update.

create policy pet_photos_select on storage.objects
  for select using (
    bucket_id = 'pet-photos'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );
