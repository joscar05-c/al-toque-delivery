-- Bucket público para las imágenes de los platos (menu_items.image_url).
-- Es público para que la URL generada con getPublicUrl sea legible sin auth.
insert into storage.buckets (id, name, public)
values ('menu_images', 'menu_images', true)
on conflict (id) do nothing;

-- Solo usuarios autenticados (rol `authenticated`, que incluye a los
-- propietarios de restaurante vía Third-Party Auth de Firebase) pueden subir.
create policy "Usuarios autenticados pueden subir imágenes de platos"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'menu_images');

-- Permite borrar imágenes (p. ej. al reemplazar una foto de plato).
create policy "Usuarios autenticados pueden borrar imágenes de platos"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'menu_images');

-- El bucket es público, pero dejamos explícita la lectura pública por si se
-- cambia la visibilidad del bucket en el futuro.
create policy "Lectura pública de imágenes de platos"
  on storage.objects
  for select
  to public
  using (bucket_id = 'menu_images');
