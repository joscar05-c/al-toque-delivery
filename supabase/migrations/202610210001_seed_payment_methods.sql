-- Poblar métodos de pago iniciales
INSERT INTO public.payment_methods (code, name, description, is_active)
VALUES 
  ('cash', 'Efectivo', 'Pago contraentrega en efectivo al recibir o recoger el pedido', true),
  ('yape', 'Yape', 'Transferencia móvil mediante aplicativo Yape', true),
  ('plin', 'Plin', 'Transferencia móvil mediante aplicativo Plin', true),
  ('card', 'Tarjeta', 'Pago con tarjeta de débito o crédito', true)
ON CONFLICT (code) DO UPDATE 
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;
