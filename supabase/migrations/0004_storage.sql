-- 0004: bucket step-images (publik-baca) dan policy tulis/hapus per pemilik

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('step-images', 'step-images', true, 2097152, array['image/webp'])
on conflict (id) do nothing;

-- Folder pertama path wajib = uid pemilik: <user_id>/<demo_id>/<uuid>.webp
create policy step_images_insert_own on storage.objects
  for insert to authenticated
  with check (bucket_id = 'step-images' and (storage.foldername(name))[1] = auth.uid()::text);

create policy step_images_delete_own on storage.objects
  for delete to authenticated
  using (bucket_id = 'step-images' and (storage.foldername(name))[1] = auth.uid()::text);

-- list() lewat API butuh select; URL publik tidak bergantung pada policy ini.
create policy step_images_select_own on storage.objects
  for select to authenticated
  using (bucket_id = 'step-images' and (storage.foldername(name))[1] = auth.uid()::text);
