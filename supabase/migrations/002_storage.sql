-- =============================================================================
-- Dogtor · Almacenamiento de fotos de mascotas en adopción (REQ-ADO-01)
-- =============================================================================
-- Bucket público de lectura. Cada usuario solo escribe dentro de una carpeta
-- con su propio id: adopcion/<auth.uid()>/<archivo>.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('adopcion', 'adopcion', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "adopcion fotos subir" on storage.objects for insert to authenticated
  with check (bucket_id = 'adopcion' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "adopcion fotos editar" on storage.objects for update to authenticated
  using (bucket_id = 'adopcion' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "adopcion fotos borrar" on storage.objects for delete to authenticated
  using (bucket_id = 'adopcion' and (storage.foldername(name))[1] = auth.uid()::text);
