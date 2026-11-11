-- Migración Opción 2 (pre-requisitos normalizados + auto-asignación Flota Propia):
-- 1. Catálogo normalizado public.driver_types y tabla subtipo 1:1 public.driver_profiles (3NF)
-- 2. Diferenciación estricta entre repartidores de plataforma ('platform') y de flota propia ('restaurant_own')
-- 3. Integridad en BD para restaurant_drivers (solo role_id = 2, is_active = true, driver_type_code = 'restaurant_own')
-- 4. Auto-asignación por menor carga activa (0 pedidos primero; si solo hay 1 repartidor, todo va a él)
-- 5. RPCs actualizadas para aprobación de postulantes, auto-asignación y visibilidad aislada por modalidad

-- 1. Tabla catálogo de tipos de repartidor
CREATE TABLE IF NOT EXISTS public.driver_types (
  code text PRIMARY KEY CHECK (code IN ('platform', 'restaurant_own')),
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.driver_types (code, name, description, is_active)
VALUES
  (
    'platform',
    'Red Al Toque (Plataforma)',
    'Repartidores oficiales de la plataforma habilitados para pedidos de restaurantes con modalidad Red Al Toque.',
    true
  ),
  (
    'restaurant_own',
    'Flota Propia de Restaurante',
    'Repartidores aprobados por administración para ser vinculados exclusivamente a flotas propias de restaurantes.',
    true
  )
ON CONFLICT (code) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active;

ALTER TABLE public.driver_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_types_select_policy" ON public.driver_types;
CREATE POLICY "driver_types_select_policy"
  ON public.driver_types
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "driver_types_admin_write_policy" ON public.driver_types;
CREATE POLICY "driver_types_admin_write_policy"
  ON public.driver_types
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 2. Tabla subtipo 1:1 para atributos específicos del rol repartidor (3NF)
CREATE TABLE IF NOT EXISTS public.driver_profiles (
  user_id text PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  driver_type_code text NOT NULL DEFAULT 'platform' REFERENCES public.driver_types(code),
  vehicle_type public.driver_applications_vehicle_type_enum,
  vehicle_plate varchar,
  vehicle_brand varchar,
  vehicle_model varchar,
  license_number varchar,
  approved_by text REFERENCES public.users(id) ON DELETE SET NULL,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_type_code
  ON public.driver_profiles (driver_type_code);

CREATE INDEX IF NOT EXISTS idx_driver_profiles_approved_by
  ON public.driver_profiles (approved_by)
  WHERE approved_by IS NOT NULL;

ALTER TABLE public.driver_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "driver_profiles_select_policy" ON public.driver_profiles;
CREATE POLICY "driver_profiles_select_policy"
  ON public.driver_profiles
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.jwt() ->> 'sub')
    OR public.is_admin()
    OR EXISTS (
      SELECT 1
      FROM public.restaurant_drivers rd
      WHERE rd.driver_id = driver_profiles.user_id
        AND public.is_restaurant_owner(rd.restaurant_id)
    )
  );

DROP POLICY IF EXISTS "driver_profiles_admin_write_policy" ON public.driver_profiles;
CREATE POLICY "driver_profiles_admin_write_policy"
  ON public.driver_profiles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Backfill para cualquier repartidor existente sin fila en driver_profiles
INSERT INTO public.driver_profiles (user_id, driver_type_code, approved_at)
SELECT
  u.id,
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.restaurant_drivers rd
      WHERE rd.driver_id = u.id
        AND rd.is_active = true
    ) THEN 'restaurant_own'
    ELSE 'platform'
  END AS driver_type_code,
  u.created_at
FROM public.users u
WHERE u.role_id = 2
ON CONFLICT (user_id) DO NOTHING;

-- 3. Tipo solicitado en postulaciones de repartidor
ALTER TABLE public.driver_applications
  ADD COLUMN IF NOT EXISTS requested_driver_type text NOT NULL DEFAULT 'platform'
  REFERENCES public.driver_types(code);

CREATE INDEX IF NOT EXISTS idx_driver_applications_requested_type
  ON public.driver_applications (requested_driver_type);

-- 4. Índices de apoyo para auto-asignación y tracking
CREATE INDEX IF NOT EXISTS idx_orders_driver_status_updated
  ON public.orders (driver_id, status, updated_at DESC)
  WHERE driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_driver_locations_driver_updated
  ON public.driver_locations (driver_id, updated_at DESC);

-- 5. Integridad en BD entre restaurant_drivers y driver_profiles
CREATE OR REPLACE FUNCTION public.validate_restaurant_driver_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_role_id integer;
  v_is_active boolean;
  v_driver_type text;
BEGIN
  IF NEW.is_active = false THEN
    RETURN NEW;
  END IF;

  SELECT u.role_id, u.is_active, dp.driver_type_code
    INTO v_role_id, v_is_active, v_driver_type
  FROM public.users u
  LEFT JOIN public.driver_profiles dp ON dp.user_id = u.id
  WHERE u.id = NEW.driver_id;

  IF NOT FOUND OR v_role_id IS DISTINCT FROM 2 OR v_is_active IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'El usuario debe estar aprobado y activo con rol repartidor antes de vincularlo a un restaurante';
  END IF;

  IF v_driver_type IS DISTINCT FROM 'restaurant_own' THEN
    RAISE EXCEPTION 'Solo repartidores con modalidad Flota Propia (restaurant_own) pueden vincularse a un restaurante';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_restaurant_driver_profile ON public.restaurant_drivers;
CREATE TRIGGER trg_validate_restaurant_driver_profile
  BEFORE INSERT OR UPDATE ON public.restaurant_drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_restaurant_driver_profile();

REVOKE ALL ON FUNCTION public.validate_restaurant_driver_profile() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_restaurant_driver_profile() TO service_role;

CREATE OR REPLACE FUNCTION public.sync_driver_profile_type_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF OLD.driver_type_code = 'restaurant_own' AND NEW.driver_type_code <> 'restaurant_own' THEN
    UPDATE public.restaurant_drivers
       SET is_active = false,
           updated_at = now()
     WHERE driver_id = NEW.user_id
       AND is_active = true;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_driver_profile_type_change ON public.driver_profiles;
CREATE TRIGGER trg_sync_driver_profile_type_change
  AFTER UPDATE OF driver_type_code ON public.driver_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_driver_profile_type_change();

REVOKE ALL ON FUNCTION public.sync_driver_profile_type_change() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sync_driver_profile_type_change() TO service_role;

-- 6. Aislamiento estricto de pools de pedidos según driver_type_code y delivery_type
CREATE OR REPLACE FUNCTION public.can_driver_access_restaurant_pool(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    INNER JOIN public.driver_profiles dp
      ON dp.user_id = u.id
    INNER JOIN public.restaurant_delivery_config rdc
      ON rdc.restaurant_id = p_restaurant_id
    WHERE u.id = (select auth.jwt() ->> 'sub')
      AND u.role_id = 2
      AND u.is_active = true
      AND rdc.is_delivery_enabled = true
      AND (
        (
          dp.driver_type_code = 'platform'
          AND rdc.delivery_type::text = 'platform'
        )
        OR (
          dp.driver_type_code = 'restaurant_own'
          AND rdc.delivery_type::text = 'restaurant_own'
          AND EXISTS (
            SELECT 1
            FROM public.restaurant_drivers rd
            WHERE rd.restaurant_id = p_restaurant_id
              AND rd.driver_id = u.id
              AND rd.is_active = true
          )
        )
      )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.can_driver_access_restaurant_pool(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_driver_access_restaurant_pool(uuid) TO authenticated;

-- 7. Selección balanceada de repartidor propio (0 pedidos en curso primero; si hay 1 solo, todo va a él)
CREATE OR REPLACE FUNCTION public.pick_least_loaded_restaurant_driver(
  p_restaurant_id uuid,
  p_exclude_order_id uuid DEFAULT NULL
)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  WITH latest_loc AS (
    SELECT DISTINCT ON (dl.driver_id)
      dl.driver_id,
      dl."isActive" AS is_online
    FROM public.driver_locations dl
    ORDER BY dl.driver_id, dl.updated_at DESC
  ),
  candidate_drivers AS (
    SELECT
      rd.driver_id,
      rd.created_at AS linked_at,
      COALESCE(ll.is_online, false) AS is_online,
      COUNT(o.id) FILTER (
        WHERE (p_exclude_order_id IS NULL OR o.id <> p_exclude_order_id)
          AND o.status IN ('accepted', 'preparing', 'ready', 'picked_up')
      ) AS active_orders_count,
      COALESCE(
        MAX(o.updated_at) FILTER (
          WHERE (p_exclude_order_id IS NULL OR o.id <> p_exclude_order_id)
            AND o.status IN ('accepted', 'preparing', 'ready', 'picked_up', 'delivered')
        ),
        'epoch'::timestamptz
      ) AS last_order_at
    FROM public.restaurant_drivers rd
    INNER JOIN public.users u
      ON u.id = rd.driver_id
    INNER JOIN public.driver_profiles dp
      ON dp.user_id = rd.driver_id
    LEFT JOIN latest_loc ll
      ON ll.driver_id = rd.driver_id
    LEFT JOIN public.orders o
      ON o.driver_id = rd.driver_id
    WHERE rd.restaurant_id = p_restaurant_id
      AND rd.is_active = true
      AND u.role_id = 2
      AND u.is_active = true
      AND dp.driver_type_code = 'restaurant_own'
    GROUP BY rd.driver_id, rd.created_at, ll.is_online
  )
  SELECT driver_id
  FROM candidate_drivers
  ORDER BY
    active_orders_count ASC,
    is_online DESC,
    last_order_at ASC,
    linked_at ASC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.pick_least_loaded_restaurant_driver(uuid, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.pick_least_loaded_restaurant_driver(uuid, uuid) TO service_role;

-- Trigger automático al aceptar un pedido de restaurante con Flota Propia ('restaurant_own')
CREATE OR REPLACE FUNCTION public.trg_fn_auto_assign_restaurant_driver()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_delivery_type text;
  v_is_enabled boolean;
  v_best_driver_id text;
BEGIN
  IF NEW.status = 'accepted'
     AND OLD.status = 'pending'
     AND NEW.fulfillment_type = 'delivery'
     AND NEW.driver_id IS NULL
     AND NEW.restaurant_id IS NOT NULL THEN

    SELECT rdc.delivery_type::text, rdc.is_delivery_enabled
      INTO v_delivery_type, v_is_enabled
    FROM public.restaurant_delivery_config rdc
    WHERE rdc.restaurant_id = NEW.restaurant_id;

    IF v_is_enabled = true AND v_delivery_type = 'restaurant_own' THEN
      v_best_driver_id := public.pick_least_loaded_restaurant_driver(NEW.restaurant_id, NEW.id);
      IF v_best_driver_id IS NOT NULL THEN
        NEW.driver_id := v_best_driver_id;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_assign_restaurant_own_driver ON public.orders;
CREATE TRIGGER trg_auto_assign_restaurant_own_driver
  BEFORE UPDATE OF status ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_auto_assign_restaurant_driver();

REVOKE ALL ON FUNCTION public.trg_fn_auto_assign_restaurant_driver() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_fn_auto_assign_restaurant_driver() TO service_role;

-- RPC manual / bajo demanda para auto-asignar repartidor de flota propia
CREATE OR REPLACE FUNCTION public.auto_assign_restaurant_driver(p_order_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order public.orders%ROWTYPE;
  v_delivery_type text;
  v_is_enabled boolean;
  v_best_driver_id text;
BEGIN
  SELECT *
    INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF NOT (public.is_admin() OR public.is_restaurant_owner(v_order.restaurant_id)) THEN
    RAISE EXCEPTION 'No autorizado para asignar repartidores a este pedido'
      USING ERRCODE = '42501';
  END IF;

  IF v_order.fulfillment_type <> 'delivery' THEN
    RAISE EXCEPTION 'Este pedido es para recojo en tienda y no requiere repartidor';
  END IF;

  IF v_order.status NOT IN ('pending', 'accepted', 'preparing', 'ready') THEN
    RAISE EXCEPTION 'Solo se puede auto-asignar pedidos antes de ser recogidos';
  END IF;

  SELECT rdc.delivery_type::text, rdc.is_delivery_enabled
    INTO v_delivery_type, v_is_enabled
  FROM public.restaurant_delivery_config rdc
  WHERE rdc.restaurant_id = v_order.restaurant_id;

  IF v_is_enabled IS DISTINCT FROM true OR v_delivery_type IS DISTINCT FROM 'restaurant_own' THEN
    RAISE EXCEPTION 'La auto-asignación automática solo aplica a restaurantes con Flota Propia activa';
  END IF;

  v_best_driver_id := public.pick_least_loaded_restaurant_driver(v_order.restaurant_id, v_order.id);
  IF v_best_driver_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE public.orders
     SET driver_id = v_best_driver_id,
         updated_at = now()
   WHERE id = v_order.id;

  RETURN v_best_driver_id;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_assign_restaurant_driver(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auto_assign_restaurant_driver(uuid) TO authenticated, service_role;

-- 8. RPC atómica para aprobar postulación de repartidor definiendo su driver_type_code
CREATE OR REPLACE FUNCTION public.admin_approve_driver_application(
  p_application_id uuid,
  p_driver_type_code text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_admin_id text := (select auth.jwt() ->> 'sub');
  v_app public.driver_applications%ROWTYPE;
  v_driver_type text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Se requiere rol administrador para aprobar repartidores'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
    INTO v_app
  FROM public.driver_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud de repartidor no encontrada';
  END IF;

  IF v_app.status = 'approved' THEN
    RAISE EXCEPTION 'La solicitud ya fue aprobada previamente';
  END IF;

  v_driver_type := COALESCE(
    NULLIF(trim(p_driver_type_code), ''),
    v_app.requested_driver_type,
    'platform'
  );

  IF v_driver_type NOT IN ('platform', 'restaurant_own') THEN
    RAISE EXCEPTION 'Tipo de repartidor no válido: %', v_driver_type;
  END IF;

  UPDATE public.driver_applications
     SET status = 'approved',
         requested_driver_type = v_driver_type,
         reviewed_by = v_admin_id,
         reviewed_at = now(),
         updated_at = now()
   WHERE id = v_app.id;

  UPDATE public.users
     SET role_id = 2,
         is_active = true,
         updated_at = now()
   WHERE id = v_app.user_id;

  INSERT INTO public.driver_profiles (
    user_id,
    driver_type_code,
    vehicle_type,
    vehicle_plate,
    vehicle_brand,
    vehicle_model,
    license_number,
    approved_by,
    approved_at,
    updated_at
  )
  VALUES (
    v_app.user_id,
    v_driver_type,
    v_app.vehicle_type,
    v_app.vehicle_plate,
    v_app.vehicle_brand,
    v_app.vehicle_model,
    v_app.license_number,
    v_admin_id,
    now(),
    now()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    driver_type_code = EXCLUDED.driver_type_code,
    vehicle_type = COALESCE(EXCLUDED.vehicle_type, public.driver_profiles.vehicle_type),
    vehicle_plate = COALESCE(EXCLUDED.vehicle_plate, public.driver_profiles.vehicle_plate),
    vehicle_brand = COALESCE(EXCLUDED.vehicle_brand, public.driver_profiles.vehicle_brand),
    vehicle_model = COALESCE(EXCLUDED.vehicle_model, public.driver_profiles.vehicle_model),
    license_number = COALESCE(EXCLUDED.license_number, public.driver_profiles.license_number),
    approved_by = EXCLUDED.approved_by,
    approved_at = EXCLUDED.approved_at,
    updated_at = now();
END;
$$;

REVOKE ALL ON FUNCTION public.admin_approve_driver_application(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_driver_application(uuid, text) TO authenticated, service_role;

-- 9. Actualizar driver_claim_order para asignar driver_id sin alterar prematuramente 'pending' -> 'accepted' en cocina
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

REVOKE EXECUTE ON FUNCTION public.driver_claim_order(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.driver_claim_order(uuid) TO authenticated;
