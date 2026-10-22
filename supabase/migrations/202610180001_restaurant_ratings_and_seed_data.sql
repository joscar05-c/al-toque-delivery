-- 1. Agregar columnas a restaurants para soportar calificación, socios destacados y ordenamiento
ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS rating numeric(2,1) DEFAULT 4.5,
  ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_partner boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sales_count integer DEFAULT 0;

-- 2. Actualizar restaurante existente "Brasas y Leñas"
UPDATE public.restaurants
SET 
  rating = 4.8,
  total_reviews = 48,
  is_partner = true,
  sales_count = 120
WHERE id = '44ba00ab-85fd-4385-8661-e952a10ce53f';

-- 3. Crear categorías adicionales si no existen
INSERT INTO public.restaurant_categories (id, name, description, "isActive")
VALUES 
  ('c1000000-0000-0000-0000-000000000001', 'Hamburguesas', 'Hamburguesas artesanales y snacks', true),
  ('c1000000-0000-0000-0000-000000000002', 'Pizza', 'Pizzas clásicas y especiales', true),
  ('c1000000-0000-0000-0000-000000000003', 'Chifa', 'Comida oriental y fusión peruana', true),
  ('c1000000-0000-0000-0000-000000000004', 'Postres', 'Dulces, helados y pasteles', true)
ON CONFLICT (name) DO UPDATE 
SET "isActive" = true;

-- 4. Crear restaurantes de prueba para verificar filtros, ordenamientos y búsqueda
INSERT INTO public.restaurants (
  id, name, address, phone, city, image_url, average_prep_time, is_active, 
  rating, total_reviews, is_partner, sales_count, restaurant_category_id, owner_id
)
VALUES 
  (
    'a2000000-0000-0000-0000-000000000001',
    'Burger Bros',
    'Av. Héroes del Cenepa 210',
    '921445566',
    'bagua',
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80',
    20,
    true,
    4.9,
    86,
    true,
    210,
    'c1000000-0000-0000-0000-000000000001',
    'I1Xu9r69eBhQyWVYn8Uh9TvUIR62'
  ),
  (
    'a2000000-0000-0000-0000-000000000002',
    'Pizzería La Nona',
    'Jr. 28 de Julio 340',
    '941223344',
    'bagua',
    'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80',
    25,
    true,
    4.7,
    64,
    true,
    95,
    'c1000000-0000-0000-0000-000000000002',
    'I1Xu9r69eBhQyWVYn8Uh9TvUIR62'
  ),
  (
    'a2000000-0000-0000-0000-000000000003',
    'Chifa Hong Kong',
    'Jr. Comercio 512',
    '951667788',
    'bagua',
    'https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=800&q=80',
    15,
    true,
    4.6,
    52,
    false,
    140,
    'c1000000-0000-0000-0000-000000000003',
    'I1Xu9r69eBhQyWVYn8Uh9TvUIR62'
  )
ON CONFLICT (id) DO UPDATE
SET 
  rating = EXCLUDED.rating,
  total_reviews = EXCLUDED.total_reviews,
  is_partner = EXCLUDED.is_partner,
  sales_count = EXCLUDED.sales_count,
  average_prep_time = EXCLUDED.average_prep_time,
  is_active = true;

-- 5. Delivery config para los restaurantes
INSERT INTO public.restaurant_delivery_config (
  id, restaurant_id, delivery_fee, free_delivery_threshold, min_order_amount,
  max_delivery_distance, estimated_delivery_time, is_delivery_enabled, delivery_type
)
VALUES
  ('d2000000-0000-0000-0000-000000000001', 'a2000000-0000-0000-0000-000000000001', 3.00, 40.00, 15.00, 10, 25, true, 'platform'),
  ('d2000000-0000-0000-0000-000000000002', 'a2000000-0000-0000-0000-000000000002', 0.00, 0.00, 20.00, 8, 30, true, 'platform'),
  ('d2000000-0000-0000-0000-000000000003', 'a2000000-0000-0000-0000-000000000003', 2.50, 45.00, 10.00, 12, 20, true, 'platform')
ON CONFLICT (restaurant_id) DO NOTHING;

-- 6. Platos del menú para probar búsquedas por comida
INSERT INTO public.menu_items (id, name, description, price, is_active, restaurant_id)
VALUES
  ('e2000000-0000-0000-0000-000000000001', 'Hamburguesa Clásica Doble', 'Doble carne artesanal con queso cheddar y tocino', 18.00, true, 'a2000000-0000-0000-0000-000000000001'),
  ('e2000000-0000-0000-0000-000000000002', 'Papas Rústicas', 'Papas fritas crocantes con salsa de la casa', 8.50, true, 'a2000000-0000-0000-0000-000000000001'),
  ('e2000000-0000-0000-0000-000000000003', 'Pizza Americana Grande', 'Jamón inglés, abundante queso mozzarella y orégano', 32.00, true, 'a2000000-0000-0000-0000-000000000002'),
  ('e2000000-0000-0000-0000-000000000004', 'Pizza Pepperoni', 'Pepperoni importado con queso mozzarella fundido', 35.00, true, 'a2000000-0000-0000-0000-000000000002'),
  ('e2000000-0000-0000-0000-000000000005', 'Arroz Chaufa Especial', 'Chaufa al wok con pollo, chancho y verduras frescas', 22.00, true, 'a2000000-0000-0000-0000-000000000003'),
  ('e2000000-0000-0000-0000-000000000006', 'Tallarín Saltado de Pollo', 'Tallarines salteados con pechuga de pollo y cebolla china', 24.00, true, 'a2000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;
