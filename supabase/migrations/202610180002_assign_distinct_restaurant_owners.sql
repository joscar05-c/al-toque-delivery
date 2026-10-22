-- Migración para registrar dueños específicos para cada restaurante nuevo y asignarlos
INSERT INTO public.users (id, name, phone, phone_verified, is_active, role_id, created_at, updated_at)
VALUES 
  ('Sxqk5VsDidd0SRAbzw7UOAjGxrx1', 'Dueño Burger Bros', '+51921445566', true, true, 3, NOW(), NOW()),
  ('OhVAfVBqkPU8kS095dWWFB5ROUt1', 'Dueño Pizzería La Nona', '+51941223344', true, true, 3, NOW(), NOW()),
  ('USfrSt9eSwTXe70mfvNLyU11A0n1', 'Dueño Chifa Hong Kong', '+51951667788', true, true, 3, NOW(), NOW())
ON CONFLICT (id) DO UPDATE 
SET 
  name = EXCLUDED.name,
  phone = EXCLUDED.phone,
  role_id = EXCLUDED.role_id,
  is_active = true,
  updated_at = NOW();

-- Asignar cada restaurante a su respectivo dueño
UPDATE public.restaurants
SET owner_id = 'Sxqk5VsDidd0SRAbzw7UOAjGxrx1'
WHERE id = 'a2000000-0000-0000-0000-000000000001';

UPDATE public.restaurants
SET owner_id = 'OhVAfVBqkPU8kS095dWWFB5ROUt1'
WHERE id = 'a2000000-0000-0000-0000-000000000002';

UPDATE public.restaurants
SET owner_id = 'USfrSt9eSwTXe70mfvNLyU11A0n1'
WHERE id = 'a2000000-0000-0000-0000-000000000003';

UPDATE public.restaurants
SET owner_id = 'I1Xu9r69eBhQyWVYn8Uh9TvUIR62'
WHERE id = '44ba00ab-85fd-4385-8661-e952a10ce53f';
