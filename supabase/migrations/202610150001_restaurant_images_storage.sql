-- Bucket público para la portada de los restaurantes (restaurants.image_url).
-- Las subidas se hacen con URL firmada generada por service_role, así que no
-- hace falta una policy de INSERT para usuarios autenticados.
insert into storage.buckets (id, name, public)
values ('restaurant_images', 'restaurant_images', true)
on conflict (id) do nothing;

create policy "Lectura pública de portadas de restaurantes"
  on storage.objects for select
  using (bucket_id = 'restaurant_images');
