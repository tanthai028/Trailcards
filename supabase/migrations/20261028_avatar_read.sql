-- Replacing a picture (upload with upsert) also needs read access to the existing file.
create policy "members read pictures" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (select public.is_member()));
