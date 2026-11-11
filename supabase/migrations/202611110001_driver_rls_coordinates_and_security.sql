-- ============================================================================
-- Migración: Soporte completo de RLS, coordenadas de entrega y RPCs seguras
--            para repartidores + habilitación de RLS en tablas expuestas.
-- ============================================================================

-- 1. Coordenadas planas en addresses, orders y restaurants + fulfillment_type
ALTER TABLE public.addresses
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

UPDATE public.addresses
SET
  latitude = ST_Y(location::geometry),
  longitude = ST_X(location::geometry)
WHERE location IS NOT NULL
  AND (latitude IS NULL OR longitude IS NULL);

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_latitude double precision,
  ADD COLUMN IF NOT EXISTS delivery_longitude double precision,
  ADD COLUMN IF NOT EXISTS fulfillment_type text NOT NULL DEFAULT 'delivery';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'orders_fulfillment_type_check'
      AND conrelid = 'public.orders'::regclass
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_fulfillment_type_check
      CHECK (fulfillment_type IN ('delivery', 'pickup'));
  END IF;
END $$;

ALTER TABLE public.restaurants
  ADD COLUMN IF NOT EXISTS latitude double precision,
  ADD COLUMN IF NOT EXISTS longitude double precision;

UPDATE public.restaurants
SET
  latitude = ST_Y(location::geometry),
  longitude = ST_X(location::geometry)
WHERE location IS NOT NULL
  AND (latitude IS NULL OR longitude IS NULL);

-- 2. Índices para rendimiento en políticas RLS y consultas de repartidor
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON public.orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_driver_id ON public.orders(driver_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_id ON public.orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_updated
  ON public.driver_locations(driver_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_applications_user_id ON public.driver_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_applications_user_id ON public.restaurant_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order_id ON public.reviews(order_id);

-- 3. Endurecer create_address (search_path fijo, validación de usuario y lat/lng)
CREATE OR REPLACE FUNCTION public.create_address(
  p_user_id text,
  p_street text,
  p_city text,
  p_postal_code text,
  p_reference text,
  p_type public.addresses_type_enum,
  p_is_default boolean,
  p_latitude double precision,
  p_longitude double precision
)
RETURNS SETOF public.addresses
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_sub text := (select auth.jwt() ->> 'sub');
BEGIN
  IF v_sub IS NULL OR v_sub <> p_user_id THEN
    RAISE EXCEPTION 'No autorizado para crear direcciones para otro usuario';
  END IF;

  IF p_is_default THEN
    UPDATE public.addresses
    SET is_default = FALSE
    WHERE user_id = p_user_id AND is_default = TRUE;
  END IF;

  RETURN QUERY
  INSERT INTO public.addresses (
    user_id,
    street,
    city,
    postal_code,
    reference,
    type,
    is_default,
    latitude,
    longitude,
    location
  )
  VALUES (
    p_user_id,
    p_street,
    p_city,
    p_postal_code,
    p_reference,
    p_type,
    p_is_default,
    p_latitude,
    p_longitude,
    ST_SetSRID(ST_MakePoint(p_longitude, p_latitude), 4326)::geography
  )
  RETURNING *;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.create_address(
  text, text, text, text, text, public.addresses_type_enum, boolean, double precision, double precision
) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_address(
  text, text, text, text, text, public.addresses_type_enum, boolean, double precision, double precision
) TO authenticated;

-- 4. Funciones auxiliares de seguridad para repartidores
CREATE OR REPLACE FUNCTION public.is_active_driver()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    WHERE u.id = (select auth.jwt() ->> 'sub')
      AND u.role_id = 2
      AND u.is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.can_driver_access_restaurant_pool(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT public.is_active_driver()
    AND (
      EXISTS (
        SELECT 1
        FROM public.restaurant_drivers rd
        WHERE rd.restaurant_id = p_restaurant_id
          AND rd.driver_id = (select auth.jwt() ->> 'sub')
          AND rd.is_active = true
      )
      OR EXISTS (
        SELECT 1
        FROM public.restaurant_delivery_config rdc
        WHERE rdc.restaurant_id = p_restaurant_id
          AND rdc.is_delivery_enabled = true
          AND rdc.delivery_type::text = 'platform'
      )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.is_active_driver() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_driver() TO authenticated;
REVOKE EXECUTE ON FUNCTION public.can_driver_access_restaurant_pool(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_driver_access_restaurant_pool(uuid) TO authenticated;

-- 5. Políticas RLS de orders, order_items y order_payments para repartidores
DROP POLICY IF EXISTS "orders_select_policy" ON public.orders;
CREATE POLICY "orders_select_policy"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    client_id = (select auth.jwt() ->> 'sub')
    OR (driver_id = (select auth.jwt() ->> 'sub') AND public.is_active_driver())
    OR (
      driver_id IS NULL
      AND fulfillment_type = 'delivery'
      AND status IN ('pending', 'accepted', 'preparing', 'ready')
      AND public.can_driver_access_restaurant_pool(restaurant_id)
    )
    OR public.is_restaurant_owner(restaurant_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    client_id = (select auth.jwt() ->> 'sub')
    OR (driver_id = (select auth.jwt() ->> 'sub') AND public.is_active_driver())
    OR (
      driver_id IS NULL
      AND fulfillment_type = 'delivery'
      AND status IN ('pending', 'accepted', 'preparing', 'ready')
      AND public.can_driver_access_restaurant_pool(restaurant_id)
    )
    OR public.is_restaurant_owner(restaurant_id)
    OR public.is_admin()
  )
  WITH CHECK (
    client_id = (select auth.jwt() ->> 'sub')
    OR (driver_id = (select auth.jwt() ->> 'sub') AND public.is_active_driver())
    OR public.is_restaurant_owner(restaurant_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "order_items_select_policy" ON public.order_items;
CREATE POLICY "order_items_select_policy"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.client_id = (select auth.jwt() ->> 'sub')
          OR (o.driver_id = (select auth.jwt() ->> 'sub') AND public.is_active_driver())
          OR (
            o.driver_id IS NULL
            AND o.fulfillment_type = 'delivery'
            AND o.status IN ('pending', 'accepted', 'preparing', 'ready')
            AND public.can_driver_access_restaurant_pool(o.restaurant_id)
          )
          OR public.is_restaurant_owner(o.restaurant_id)
          OR public.is_admin()
        )
    )
  );

DROP POLICY IF EXISTS "order_payments_select_policy" ON public.order_payments;
CREATE POLICY "order_payments_select_policy"
  ON public.order_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_payments.order_id
        AND (
          o.client_id = (select auth.jwt() ->> 'sub')
          OR (o.driver_id = (select auth.jwt() ->> 'sub') AND public.is_active_driver())
          OR (
            o.driver_id IS NULL
            AND o.fulfillment_type = 'delivery'
            AND o.status IN ('pending', 'accepted', 'preparing', 'ready')
            AND public.can_driver_access_restaurant_pool(o.restaurant_id)
          )
          OR public.is_restaurant_owner(o.restaurant_id)
          OR public.is_admin()
        )
    )
  );

-- 6. RPCs seguras para que el repartidor lea pedidos + contacto del cliente + coordenadas
CREATE OR REPLACE FUNCTION public.get_driver_orders(p_include_history boolean DEFAULT false)
RETURNS TABLE (
  id uuid,
  status public.orders_status_enum,
  total numeric,
  notes text,
  "deliveryAddress" text,
  delivery_latitude double precision,
  delivery_longitude double precision,
  fulfillment_type text,
  estimated_prep_time integer,
  estimated_ready_time timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  client_id text,
  driver_id text,
  restaurant_id uuid,
  client_name varchar,
  client_phone varchar,
  restaurant_name varchar,
  restaurant_address varchar,
  restaurant_phone varchar,
  restaurant_city text,
  restaurant_latitude double precision,
  restaurant_longitude double precision,
  delivery_type text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id text := (select auth.jwt() ->> 'sub');
BEGIN
  IF NOT public.is_active_driver() THEN
    RAISE EXCEPTION 'Cuenta de repartidor no autorizada o suspendida';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.status,
    o.total,
    o.notes,
    o."deliveryAddress",
    o.delivery_latitude,
    o.delivery_longitude,
    o.fulfillment_type,
    o.estimated_prep_time,
    o.estimated_ready_time,
    o.confirmed_at,
    o.created_at,
    o.updated_at,
    o.client_id,
    o.driver_id,
    o.restaurant_id,
    c.name AS client_name,
    c.phone AS client_phone,
    r.name AS restaurant_name,
    r.address AS restaurant_address,
    r.phone AS restaurant_phone,
    r.city::text AS restaurant_city,
    COALESCE(r.latitude, ST_Y(r.location::geometry)) AS restaurant_latitude,
    COALESCE(r.longitude, ST_X(r.location::geometry)) AS restaurant_longitude,
    rdc.delivery_type::text AS delivery_type
  FROM public.orders o
  LEFT JOIN public.users c ON c.id = o.client_id
  LEFT JOIN public.restaurants r ON r.id = o.restaurant_id
  LEFT JOIN public.restaurant_delivery_config rdc ON rdc.restaurant_id = o.restaurant_id
  WHERE
    (
      p_include_history = true
      AND o.driver_id = v_driver_id
      AND o.status IN ('delivered', 'cancelled')
    )
    OR (
      p_include_history = false
      AND o.status NOT IN ('delivered', 'cancelled')
      AND (
        o.driver_id = v_driver_id
        OR (
          o.driver_id IS NULL
          AND o.fulfillment_type = 'delivery'
          AND o.status IN ('pending', 'accepted', 'preparing', 'ready')
          AND public.can_driver_access_restaurant_pool(o.restaurant_id)
        )
      )
    )
  ORDER BY
    CASE WHEN p_include_history THEN o.updated_at END DESC,
    CASE WHEN NOT p_include_history THEN o.created_at END ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_driver_order_detail(p_order_id uuid)
RETURNS TABLE (
  id uuid,
  status public.orders_status_enum,
  total numeric,
  notes text,
  "deliveryAddress" text,
  delivery_latitude double precision,
  delivery_longitude double precision,
  fulfillment_type text,
  estimated_prep_time integer,
  estimated_ready_time timestamptz,
  confirmed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  client_id text,
  driver_id text,
  restaurant_id uuid,
  client_name varchar,
  client_phone varchar,
  restaurant_name varchar,
  restaurant_address varchar,
  restaurant_phone varchar,
  restaurant_city text,
  restaurant_latitude double precision,
  restaurant_longitude double precision,
  delivery_type text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id text := (select auth.jwt() ->> 'sub');
BEGIN
  IF NOT public.is_active_driver() THEN
    RAISE EXCEPTION 'Cuenta de repartidor no autorizada o suspendida';
  END IF;

  RETURN QUERY
  SELECT
    o.id,
    o.status,
    o.total,
    o.notes,
    o."deliveryAddress",
    o.delivery_latitude,
    o.delivery_longitude,
    o.fulfillment_type,
    o.estimated_prep_time,
    o.estimated_ready_time,
    o.confirmed_at,
    o.created_at,
    o.updated_at,
    o.client_id,
    o.driver_id,
    o.restaurant_id,
    c.name AS client_name,
    c.phone AS client_phone,
    r.name AS restaurant_name,
    r.address AS restaurant_address,
    r.phone AS restaurant_phone,
    r.city::text AS restaurant_city,
    COALESCE(r.latitude, ST_Y(r.location::geometry)) AS restaurant_latitude,
    COALESCE(r.longitude, ST_X(r.location::geometry)) AS restaurant_longitude,
    rdc.delivery_type::text AS delivery_type
  FROM public.orders o
  LEFT JOIN public.users c ON c.id = o.client_id
  LEFT JOIN public.restaurants r ON r.id = o.restaurant_id
  LEFT JOIN public.restaurant_delivery_config rdc ON rdc.restaurant_id = o.restaurant_id
  WHERE o.id = p_order_id
    AND (
      o.driver_id = v_driver_id
      OR (
        o.driver_id IS NULL
        AND o.fulfillment_type = 'delivery'
        AND o.status IN ('pending', 'accepted', 'preparing', 'ready')
        AND public.can_driver_access_restaurant_pool(o.restaurant_id)
      )
    )
  LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.driver_claim_order(p_order_id uuid)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id text := (select auth.jwt() ->> 'sub');
  v_updated public.orders;
BEGIN
  IF NOT public.is_active_driver() THEN
    RAISE EXCEPTION 'Cuenta de repartidor no autorizada o suspendida';
  END IF;

  UPDATE public.orders o
  SET
    driver_id = v_driver_id,
    status = CASE WHEN o.status = 'pending' THEN 'accepted'::public.orders_status_enum ELSE o.status END,
    updated_at = now()
  WHERE o.id = p_order_id
    AND o.driver_id IS NULL
    AND o.fulfillment_type = 'delivery'
    AND o.status IN ('pending', 'accepted', 'preparing', 'ready')
    AND public.can_driver_access_restaurant_pool(o.restaurant_id)
  RETURNING o.* INTO v_updated;

  IF v_updated.id IS NULL THEN
    RAISE EXCEPTION 'El pedido ya fue tomado por otro repartidor o no está disponible';
  END IF;

  RETURN v_updated;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_driver_orders(boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_driver_orders(boolean) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.get_driver_order_detail(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_driver_order_detail(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.driver_claim_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_claim_order(uuid) TO authenticated;

-- 7. Habilitar RLS y crear políticas en tablas públicas expuestas (propiedad de postgres)

-- 7.1 driver_locations
ALTER TABLE public.driver_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_locations_select_policy" ON public.driver_locations;
CREATE POLICY "driver_locations_select_policy"
  ON public.driver_locations
  FOR SELECT
  TO authenticated
  USING (
    driver_id = (select auth.jwt() ->> 'sub')
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.driver_id = driver_locations.driver_id
        AND o.client_id = (select auth.jwt() ->> 'sub')
        AND o.status IN ('accepted', 'preparing', 'ready', 'picked_up', 'delivered')
    )
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.restaurants r ON r.id = o.restaurant_id
      WHERE o.driver_id = driver_locations.driver_id
        AND r.owner_id = (select auth.jwt() ->> 'sub')
    )
    OR EXISTS (
      SELECT 1
      FROM public.restaurant_drivers rd
      JOIN public.restaurants r ON r.id = rd.restaurant_id
      WHERE rd.driver_id = driver_locations.driver_id
        AND r.owner_id = (select auth.jwt() ->> 'sub')
    )
  );

DROP POLICY IF EXISTS "driver_locations_insert_policy" ON public.driver_locations;
CREATE POLICY "driver_locations_insert_policy"
  ON public.driver_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    driver_id = (select auth.jwt() ->> 'sub')
    AND public.is_active_driver()
  );

DROP POLICY IF EXISTS "driver_locations_update_policy" ON public.driver_locations;
CREATE POLICY "driver_locations_update_policy"
  ON public.driver_locations
  FOR UPDATE
  TO authenticated
  USING (
    driver_id = (select auth.jwt() ->> 'sub')
    AND public.is_active_driver()
  )
  WITH CHECK (
    driver_id = (select auth.jwt() ->> 'sub')
    AND public.is_active_driver()
  );

DROP POLICY IF EXISTS "driver_locations_delete_policy" ON public.driver_locations;
CREATE POLICY "driver_locations_delete_policy"
  ON public.driver_locations
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 7.2 driver_applications
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_applications_select_policy" ON public.driver_applications;
CREATE POLICY "driver_applications_select_policy"
  ON public.driver_applications
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.jwt() ->> 'sub')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "driver_applications_insert_policy" ON public.driver_applications;
CREATE POLICY "driver_applications_insert_policy"
  ON public.driver_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "driver_applications_update_policy" ON public.driver_applications;
CREATE POLICY "driver_applications_update_policy"
  ON public.driver_applications
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = (select auth.jwt() ->> 'sub') AND status IN ('draft', 'pending', 'rejected'))
    OR public.is_admin()
  )
  WITH CHECK (
    (user_id = (select auth.jwt() ->> 'sub') AND status IN ('draft', 'pending'))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "driver_applications_delete_policy" ON public.driver_applications;
CREATE POLICY "driver_applications_delete_policy"
  ON public.driver_applications
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 7.3 restaurant_applications
ALTER TABLE public.restaurant_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "restaurant_applications_select_policy" ON public.restaurant_applications;
CREATE POLICY "restaurant_applications_select_policy"
  ON public.restaurant_applications
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.jwt() ->> 'sub')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "restaurant_applications_insert_policy" ON public.restaurant_applications;
CREATE POLICY "restaurant_applications_insert_policy"
  ON public.restaurant_applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "restaurant_applications_update_policy" ON public.restaurant_applications;
CREATE POLICY "restaurant_applications_update_policy"
  ON public.restaurant_applications
  FOR UPDATE
  TO authenticated
  USING (
    (user_id = (select auth.jwt() ->> 'sub') AND status IN ('pending', 'rejected'))
    OR public.is_admin()
  )
  WITH CHECK (
    (user_id = (select auth.jwt() ->> 'sub') AND status = 'pending')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "restaurant_applications_delete_policy" ON public.restaurant_applications;
CREATE POLICY "restaurant_applications_delete_policy"
  ON public.restaurant_applications
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 7.4 device_tokens
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "device_tokens_select_policy" ON public.device_tokens;
CREATE POLICY "device_tokens_select_policy"
  ON public.device_tokens
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.jwt() ->> 'sub')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "device_tokens_insert_policy" ON public.device_tokens;
CREATE POLICY "device_tokens_insert_policy"
  ON public.device_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.jwt() ->> 'sub')
  );

DROP POLICY IF EXISTS "device_tokens_update_policy" ON public.device_tokens;
CREATE POLICY "device_tokens_update_policy"
  ON public.device_tokens
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.jwt() ->> 'sub')
    OR public.is_admin()
  )
  WITH CHECK (
    user_id = (select auth.jwt() ->> 'sub')
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "device_tokens_delete_policy" ON public.device_tokens;
CREATE POLICY "device_tokens_delete_policy"
  ON public.device_tokens
  FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.jwt() ->> 'sub')
    OR public.is_admin()
  );

-- 7.5 reviews
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
CREATE POLICY "reviews_select_policy"
  ON public.reviews
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;
CREATE POLICY "reviews_insert_policy"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = reviews.order_id
        AND o.client_id = (select auth.jwt() ->> 'sub')
        AND o.status = 'delivered'
    )
  );

DROP POLICY IF EXISTS "reviews_update_policy" ON public.reviews;
CREATE POLICY "reviews_update_policy"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "reviews_delete_policy" ON public.reviews;
CREATE POLICY "reviews_delete_policy"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 7.6 roles & categories (lectura pública, escritura solo admin)
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_select_policy" ON public.roles;
CREATE POLICY "roles_select_policy"
  ON public.roles
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "roles_admin_manage" ON public.roles;
CREATE POLICY "roles_admin_manage"
  ON public.roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
CREATE POLICY "categories_select_policy"
  ON public.categories
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "categories_admin_manage" ON public.categories;
CREATE POLICY "categories_admin_manage"
  ON public.categories
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
