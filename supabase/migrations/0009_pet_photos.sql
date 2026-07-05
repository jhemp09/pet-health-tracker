-- Public storage bucket for pet profile photos. Unlike bloodwork (private,
-- signed URLs), photos have no privacy concern and are displayed as small
-- thumbnails all over the app, so a public bucket avoids needing a signed
-- URL fetch on every render — the public URL can be stored directly on
-- pets.photo_url and used in a plain <img>.

insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

-- Object path convention: <household_id>/<pet_id>.<ext>, same pattern as
-- the bloodwork bucket, so write access can be scoped to household members.
-- Public buckets skip RLS for reads via the public URL endpoint, so no
-- select policy is needed here.
create policy pet_photos_insert on storage.objects
  for insert with check (
    bucket_id = 'pet-photos'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );
create policy pet_photos_update on storage.objects
  for update using (
    bucket_id = 'pet-photos'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );
create policy pet_photos_delete on storage.objects
  for delete using (
    bucket_id = 'pet-photos'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );
