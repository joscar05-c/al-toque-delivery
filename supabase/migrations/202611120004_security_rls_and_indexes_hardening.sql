-- ============================================================================
-- Migration: 202611120004_security_rls_and_indexes_hardening.sql
-- Purpose (Non-destructive hardening - safe to apply directly via MCP/CLI):
--   1. Isolate 4-digit delivery PIN into private `public.order_delivery_pins`
--      table (readable only by order client and admin; never exposed via
--      `public.orders` RLS / Realtime to drivers).
--   2. Backfill existing order PINs into `public.order_delivery_pins`, add an
--      AFTER INSERT trigger on `public.orders`, and update
--      `driver_complete_delivery` + `trg_fn_notify_order_events` to read from it.
--   3. Add covering B-tree indexes for all 8 unindexed foreign keys.
--   4. Harden SECURITY DEFINER helpers (`SET search_path = public, pg_temp`,
--      `((SELECT auth.jwt()) ->> 'sub')`, revoke `EXECUTE` from `PUBLIC`/`anon`
--      where not referenced by remaining `TO public` SELECT policies).
--   5. Fix `auth_rls_initplan` across RLS policies using `ALTER POLICY`.
--
-- Note: Legacy `orders.delivery_pin` drop and duplicate `DROP POLICY` cleanup
--       are placed in `202611120005_drop_legacy_pin_column_and_duplicate_policies.sql`.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Isolate `delivery_pin` in `public.order_delivery_pins`
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_delivery_pins (
  order_id uuid PRIMARY KEY REFERENCES public.orders(id) ON DELETE CASCADE,
  pin varchar(4) NOT NULL DEFAULT lpad((floor(random() * 9000) + 1000)::int::text, 4, '0'),
  created_at timestamptz NOT NULL DEFAULT now()
);

REVOKE ALL ON TABLE public.order_delivery_pins FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.order_delivery_pins TO authenticated;
GRANT ALL ON TABLE public.order_delivery_pins TO service_role;

ALTER TABLE public.order_delivery_pins ENABLE ROW LEVEL SECURITY;

-- Backfill existing orders while legacy `orders.delivery_pin` still exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'delivery_pin'
  ) THEN
    INSERT INTO public.order_delivery_pins (order_id, pin, created_at)
    SELECT id, delivery_pin, COALESCE(created_at, now())
    FROM public.orders
    ON CONFLICT (order_id) DO NOTHING;
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- 2. Harden SECURITY DEFINER helper functions
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users
    WHERE id = ((SELECT auth.jwt()) ->> 'sub')
      AND role_id = 4
  );
$$;

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
    WHERE u.id = ((SELECT auth.jwt()) ->> 'sub')
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
  SELECT EXISTS (
    SELECT 1
    FROM public.users u
    INNER JOIN public.driver_profiles dp
      ON dp.user_id = u.id
    INNER JOIN public.restaurant_delivery_config rdc
      ON rdc.restaurant_id = p_restaurant_id
    WHERE u.id = ((SELECT auth.jwt()) ->> 'sub')
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

CREATE OR REPLACE FUNCTION public.is_restaurant_owner(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.restaurants
    WHERE id = p_restaurant_id
      AND owner_id = ((SELECT auth.jwt()) ->> 'sub')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_menu_item_owner(p_menu_item_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.menu_items mi
    JOIN public.restaurants r ON r.id = mi.restaurant_id
    WHERE mi.id = p_menu_item_id
      AND r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_option_group_owner(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.menu_option_groups mog
    JOIN public.restaurants r ON r.id = mog.restaurant_id
    WHERE mog.id = p_group_id
      AND r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
  );
$$;

-- Note: `is_admin()` stays granted to `anon` until `0005` splits `TO public`
-- policies into separate `anon` and `authenticated` SELECT policies.
REVOKE ALL ON FUNCTION public.is_active_driver() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_active_driver() TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.can_driver_access_restaurant_pool(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_driver_access_restaurant_pool(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_restaurant_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_restaurant_owner(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_menu_item_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_menu_item_owner(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_option_group_owner(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_option_group_owner(uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO service_role;

-- ----------------------------------------------------------------------------
-- 3. Auto-create PIN on order INSERT & update triggers/RPC to read private PIN
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_create_order_delivery_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.order_delivery_pins (order_id)
  VALUES (NEW.id)
  ON CONFLICT (order_id) DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_fn_create_order_delivery_pin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_fn_create_order_delivery_pin() TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_a_orders_create_delivery_pin'
      AND tgrelid = 'public.orders'::regclass
  ) THEN
    CREATE TRIGGER trg_a_orders_create_delivery_pin
      AFTER INSERT ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_fn_create_order_delivery_pin();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.trg_fn_enforce_delivery_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'UPDATE'
     AND NEW.status = 'delivered'
     AND OLD.status IS DISTINCT FROM 'delivered'
     AND COALESCE(NEW.fulfillment_type, 'delivery') = 'delivery'
  THEN
    IF COALESCE(auth.role(), '') <> 'service_role'
       AND NOT (SELECT public.is_admin())
       AND NOT (
         NEW.restaurant_id IS NOT NULL
         AND (SELECT public.is_restaurant_owner(NEW.restaurant_id))
       )
    THEN
      IF COALESCE(current_setting('app.pin_verified_order_id', true), '') <> NEW.id::text THEN
        RAISE EXCEPTION 'Debes ingresar el código PIN de 4 dígitos del cliente para confirmar la entrega.';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_fn_enforce_delivery_pin() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_fn_enforce_delivery_pin() TO service_role;

CREATE OR REPLACE FUNCTION public.driver_complete_delivery(
  p_order_id uuid,
  p_pin text
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_driver_id text := ((SELECT auth.jwt()) ->> 'sub');
  v_clean_pin text := BTRIM(COALESCE(p_pin, ''));
  v_expected_pin text;
  v_order public.orders;
BEGIN
  IF v_driver_id IS NULL OR NOT (SELECT public.is_active_driver()) THEN
    RAISE EXCEPTION 'No tienes permisos de repartidor activo.';
  END IF;

  IF v_clean_pin !~ '^\d{4}$' THEN
    RAISE EXCEPTION 'Ingresa el código PIN de 4 dígitos proporcionado por el cliente.';
  END IF;

  SELECT *
    INTO v_order
    FROM public.orders
   WHERE id = p_order_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado.';
  END IF;

  IF v_order.driver_id IS DISTINCT FROM v_driver_id THEN
    RAISE EXCEPTION 'Este pedido no está asignado a tu cuenta.';
  END IF;

  IF v_order.status <> 'picked_up' THEN
    RAISE EXCEPTION 'El pedido debe estar en estado "En camino" antes de marcarse como entregado.';
  END IF;

  SELECT odp.pin
    INTO v_expected_pin
    FROM public.order_delivery_pins odp
   WHERE odp.order_id = p_order_id;

  IF v_expected_pin IS NULL THEN
    RAISE EXCEPTION 'No se encontró el PIN de seguridad para este pedido.';
  END IF;

  IF v_expected_pin <> v_clean_pin THEN
    RAISE EXCEPTION 'Código PIN incorrecto. Verifica los 4 dígitos con el cliente.';
  END IF;

  PERFORM set_config('app.pin_verified_order_id', p_order_id::text, true);

  UPDATE public.orders
     SET status = 'delivered',
         updated_at = now()
   WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.driver_complete_delivery(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.driver_complete_delivery(uuid, text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.trg_fn_notify_order_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_restaurant_name text := 'el restaurante';
  v_delivery_type text := 'platform';
  v_actor_id text := COALESCE((SELECT auth.jwt()) ->> 'sub', '');
  v_delivery_pin text;
BEGIN
  IF NEW.restaurant_id IS NOT NULL THEN
    SELECT COALESCE(NULLIF(BTRIM(r.name), ''), 'el restaurante'),
           COALESCE(rdc.delivery_type::text, 'platform')
      INTO v_restaurant_name, v_delivery_type
      FROM public.restaurants r
      LEFT JOIN public.restaurant_delivery_config rdc
        ON rdc.restaurant_id = r.id
     WHERE r.id = NEW.restaurant_id;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.driver_id IS NOT NULL AND NEW.driver_id <> v_actor_id THEN
      INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
      VALUES (
        NEW.driver_id,
        'Nuevo pedido asignado',
        format('Se te asignó un pedido de %s.', v_restaurant_name),
        'driver_order_assigned',
        NEW.id::text,
        jsonb_build_object(
          'orderId', NEW.id,
          'target', 'driver_order',
          'status', NEW.status
        )
      );
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.driver_id IS NOT NULL
     AND NEW.driver_id IS DISTINCT FROM OLD.driver_id
     AND NEW.status IN ('pending', 'accepted', 'preparing', 'ready')
     AND NEW.driver_id <> v_actor_id
  THEN
    INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
    VALUES (
      NEW.driver_id,
      'Nuevo pedido asignado',
      format('Tienes un pedido asignado de %s.', v_restaurant_name),
      'driver_order_assigned',
      NEW.id::text,
      jsonb_build_object(
        'orderId', NEW.id,
        'target', 'driver_order',
        'status', NEW.status
      )
    );
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'accepted' AND NEW.client_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
      VALUES (
        NEW.client_id,
        '¡Pedido aceptado!',
        format('%s aceptó tu pedido y pronto comenzará a prepararlo.', v_restaurant_name),
        'order_accepted',
        NEW.id::text,
        jsonb_build_object(
          'orderId', NEW.id,
          'target', 'client_order',
          'status', NEW.status
        )
      );

    ELSIF NEW.status = 'preparing' AND NEW.client_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
      VALUES (
        NEW.client_id,
        'Preparando tu pedido',
        format('%s está preparando tu pedido.', v_restaurant_name),
        'order_preparing',
        NEW.id::text,
        jsonb_build_object(
          'orderId', NEW.id,
          'target', 'client_order',
          'status', NEW.status
        )
      );

    ELSIF NEW.status = 'ready' THEN
      IF COALESCE(NEW.fulfillment_type, 'delivery') = 'pickup' THEN
        IF NEW.client_id IS NOT NULL THEN
          INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
          VALUES (
            NEW.client_id,
            '¡Tu pedido está listo para recoger!',
            format('Ya puedes pasar por %s a recoger tu pedido.', v_restaurant_name),
            'order_ready_pickup',
            NEW.id::text,
            jsonb_build_object(
              'orderId', NEW.id,
              'target', 'client_order',
              'status', NEW.status
            )
          );
        END IF;
      ELSE
        IF NEW.driver_id IS NOT NULL AND NEW.driver_id = OLD.driver_id THEN
          INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
          VALUES (
            NEW.driver_id,
            '¡Pedido listo para recoger!',
            format('El pedido de %s ya está listo en tienda.', v_restaurant_name),
            'driver_order_ready',
            NEW.id::text,
            jsonb_build_object(
              'orderId', NEW.id,
              'target', 'driver_order',
              'status', NEW.status
            )
          );
        ELSIF NEW.driver_id IS NULL AND v_delivery_type = 'platform' THEN
          INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
          SELECT
            u.id,
            'Nuevo pedido disponible',
            format('%s tiene un pedido listo para repartir.', v_restaurant_name),
            'driver_pool_order_ready',
            NEW.id::text,
            jsonb_build_object(
              'orderId', NEW.id,
              'target', 'driver_order',
              'status', NEW.status
            )
          FROM public.users u
          JOIN public.roles ro ON ro.id = u.role_id AND ro.name = 'driver'
          LEFT JOIN public.driver_profiles dp ON dp.user_id = u.id
          WHERE u.is_active = true
            AND COALESCE(dp.driver_type_code, 'platform') = 'platform'
            AND EXISTS (
              SELECT 1
              FROM public.driver_locations dl
              WHERE dl.driver_id = u.id
                AND dl."isActive" = true
            )
          LIMIT 25;
        END IF;
      END IF;

    ELSIF NEW.status = 'picked_up' AND NEW.client_id IS NOT NULL THEN
      SELECT odp.pin
        INTO v_delivery_pin
        FROM public.order_delivery_pins odp
       WHERE odp.order_id = NEW.id;

      INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
      VALUES (
        NEW.client_id,
        '¡Tu pedido va en camino!',
        CASE
          WHEN v_delivery_pin IS NOT NULL THEN
            format(
              'El repartidor ya recogió tu pedido de %s y se dirige a tu ubicación. Tu código PIN de entrega es %s.',
              v_restaurant_name,
              v_delivery_pin
            )
          ELSE
            format(
              'El repartidor ya recogió tu pedido de %s y se dirige a tu ubicación.',
              v_restaurant_name
            )
        END,
        'order_picked_up',
        NEW.id::text,
        jsonb_build_object(
          'orderId', NEW.id,
          'target', 'client_order',
          'status', NEW.status
        )
      );

    ELSIF NEW.status = 'delivered' AND NEW.client_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
      VALUES (
        NEW.client_id,
        '¡Pedido entregado!',
        format('Tu pedido de %s fue entregado. ¡Buen provecho!', v_restaurant_name),
        'order_delivered',
        NEW.id::text,
        jsonb_build_object(
          'orderId', NEW.id,
          'target', 'client_order',
          'status', NEW.status
        )
      );

    ELSIF NEW.status = 'cancelled' THEN
      IF NEW.client_id IS NOT NULL AND NEW.client_id <> v_actor_id THEN
        INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
        VALUES (
          NEW.client_id,
          'Pedido cancelado',
          format('Tu pedido de %s fue cancelado.', v_restaurant_name),
          'order_cancelled',
          NEW.id::text,
          jsonb_build_object(
            'orderId', NEW.id,
            'target', 'client_order',
            'status', NEW.status
          )
        );
      END IF;

      IF NEW.driver_id IS NOT NULL AND NEW.driver_id <> v_actor_id THEN
        INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
        VALUES (
          NEW.driver_id,
          'Pedido cancelado',
          format('El pedido de %s que tenías asignado fue cancelado.', v_restaurant_name),
          'driver_order_cancelled',
          NEW.id::text,
          jsonb_build_object(
            'orderId', NEW.id,
            'target', 'driver_order',
            'status', NEW.status
          )
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_fn_notify_order_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_fn_notify_order_events() TO service_role;

-- ----------------------------------------------------------------------------
-- 4. Covering indexes for unindexed foreign keys
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_addresses_user_id
  ON public.addresses (user_id);

CREATE INDEX IF NOT EXISTS idx_driver_applications_reviewed_by
  ON public.driver_applications (reviewed_by);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_order_items_menu_item_id
  ON public.order_items (menu_item_id);

CREATE INDEX IF NOT EXISTS idx_order_payments_verified_by
  ON public.order_payments (verified_by);

CREATE INDEX IF NOT EXISTS idx_restaurant_applications_reviewed_by
  ON public.restaurant_applications (reviewed_by);

CREATE INDEX IF NOT EXISTS idx_restaurant_applications_category_id
  ON public.restaurant_applications (category_id);

CREATE INDEX IF NOT EXISTS idx_restaurants_category_id
  ON public.restaurants (restaurant_category_id);

-- ----------------------------------------------------------------------------
-- 5. RLS Policy Optimization (private PIN policy & auth_rls_initplan fixes)
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'order_delivery_pins'
      AND policyname = 'order_delivery_pins_select_client_or_admin'
  ) THEN
    CREATE POLICY order_delivery_pins_select_client_or_admin
      ON public.order_delivery_pins
      FOR SELECT
      TO authenticated
      USING (
        (SELECT public.is_admin())
        OR EXISTS (
          SELECT 1
          FROM public.orders o
          WHERE o.id = order_delivery_pins.order_id
            AND o.client_id = ((SELECT auth.jwt()) ->> 'sub')
        )
      );
  END IF;
END $$;

-- notifications
ALTER POLICY notifications_select_own_or_admin ON public.notifications
  TO authenticated
  USING (
    user_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (SELECT public.is_admin())
  );

ALTER POLICY notifications_update_own_or_admin ON public.notifications
  TO authenticated
  USING (
    user_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    user_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (SELECT public.is_admin())
  );

-- addresses
ALTER POLICY addresses_select_own ON public.addresses
  TO authenticated
  USING (user_id = ((SELECT auth.jwt()) ->> 'sub'));

ALTER POLICY addresses_insert_own ON public.addresses
  TO authenticated
  WITH CHECK (user_id = ((SELECT auth.jwt()) ->> 'sub'));

ALTER POLICY addresses_update_own ON public.addresses
  TO authenticated
  USING (user_id = ((SELECT auth.jwt()) ->> 'sub'))
  WITH CHECK (user_id = ((SELECT auth.jwt()) ->> 'sub'));

ALTER POLICY addresses_delete_own ON public.addresses
  TO authenticated
  USING (user_id = ((SELECT auth.jwt()) ->> 'sub'));

-- device_tokens
ALTER POLICY device_tokens_select_policy ON public.device_tokens
  TO authenticated
  USING (user_id = ((SELECT auth.jwt()) ->> 'sub') OR (SELECT public.is_admin()));

ALTER POLICY device_tokens_insert_policy ON public.device_tokens
  TO authenticated
  WITH CHECK (user_id = ((SELECT auth.jwt()) ->> 'sub'));

ALTER POLICY device_tokens_update_policy ON public.device_tokens
  TO authenticated
  USING (user_id = ((SELECT auth.jwt()) ->> 'sub') OR (SELECT public.is_admin()))
  WITH CHECK (user_id = ((SELECT auth.jwt()) ->> 'sub') OR (SELECT public.is_admin()));

ALTER POLICY device_tokens_delete_policy ON public.device_tokens
  TO authenticated
  USING (user_id = ((SELECT auth.jwt()) ->> 'sub') OR (SELECT public.is_admin()));

-- driver_applications
ALTER POLICY driver_applications_select_policy ON public.driver_applications
  TO authenticated
  USING (user_id = ((SELECT auth.jwt()) ->> 'sub') OR (SELECT public.is_admin()));

ALTER POLICY driver_applications_insert_policy ON public.driver_applications
  TO authenticated
  WITH CHECK (user_id = ((SELECT auth.jwt()) ->> 'sub'));

ALTER POLICY driver_applications_update_policy ON public.driver_applications
  TO authenticated
  USING (
    (
      user_id = ((SELECT auth.jwt()) ->> 'sub')
      AND status = ANY (ARRAY['draft'::driver_applications_status_enum, 'pending'::driver_applications_status_enum, 'rejected'::driver_applications_status_enum])
    )
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    (
      user_id = ((SELECT auth.jwt()) ->> 'sub')
      AND status = ANY (ARRAY['draft'::driver_applications_status_enum, 'pending'::driver_applications_status_enum])
    )
    OR (SELECT public.is_admin())
  );

ALTER POLICY driver_applications_delete_policy ON public.driver_applications
  TO authenticated
  USING ((SELECT public.is_admin()));

-- restaurant_applications
ALTER POLICY restaurant_applications_select_policy ON public.restaurant_applications
  TO authenticated
  USING (user_id = ((SELECT auth.jwt()) ->> 'sub') OR (SELECT public.is_admin()));

ALTER POLICY restaurant_applications_insert_policy ON public.restaurant_applications
  TO authenticated
  WITH CHECK (user_id = ((SELECT auth.jwt()) ->> 'sub'));

ALTER POLICY restaurant_applications_update_policy ON public.restaurant_applications
  TO authenticated
  USING (
    (
      user_id = ((SELECT auth.jwt()) ->> 'sub')
      AND status = ANY (ARRAY['pending'::restaurant_applications_status_enum, 'rejected'::restaurant_applications_status_enum])
    )
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    (
      user_id = ((SELECT auth.jwt()) ->> 'sub')
      AND status = 'pending'::restaurant_applications_status_enum
    )
    OR (SELECT public.is_admin())
  );

ALTER POLICY restaurant_applications_delete_policy ON public.restaurant_applications
  TO authenticated
  USING ((SELECT public.is_admin()));

-- driver_locations
ALTER POLICY driver_locations_select_policy ON public.driver_locations
  TO authenticated
  USING (
    driver_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.driver_id = driver_locations.driver_id
        AND o.client_id = ((SELECT auth.jwt()) ->> 'sub')
        AND o.status = ANY (ARRAY[
          'accepted'::orders_status_enum,
          'preparing'::orders_status_enum,
          'ready'::orders_status_enum,
          'picked_up'::orders_status_enum,
          'delivered'::orders_status_enum
        ])
    )
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.restaurants r ON r.id = o.restaurant_id
      WHERE o.driver_id = driver_locations.driver_id
        AND r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
    )
    OR EXISTS (
      SELECT 1
      FROM public.restaurant_drivers rd
      JOIN public.restaurants r ON r.id = rd.restaurant_id
      WHERE rd.driver_id = driver_locations.driver_id
        AND r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
    )
  );

ALTER POLICY driver_locations_insert_policy ON public.driver_locations
  TO authenticated
  WITH CHECK (
    driver_id = ((SELECT auth.jwt()) ->> 'sub')
    AND (SELECT public.is_active_driver())
  );

ALTER POLICY driver_locations_update_policy ON public.driver_locations
  TO authenticated
  USING (
    driver_id = ((SELECT auth.jwt()) ->> 'sub')
    AND (SELECT public.is_active_driver())
  )
  WITH CHECK (
    driver_id = ((SELECT auth.jwt()) ->> 'sub')
    AND (SELECT public.is_active_driver())
  );

ALTER POLICY driver_locations_delete_policy ON public.driver_locations
  TO authenticated
  USING ((SELECT public.is_admin()));

-- orders
ALTER POLICY orders_insert_policy ON public.orders
  TO authenticated
  WITH CHECK (client_id = ((SELECT auth.jwt()) ->> 'sub'));

ALTER POLICY orders_delete_policy ON public.orders
  TO authenticated
  USING (
    client_id = ((SELECT auth.jwt()) ->> 'sub')
    AND status = 'pending'::orders_status_enum
  );

ALTER POLICY orders_select_policy ON public.orders
  TO authenticated
  USING (
    client_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (driver_id = ((SELECT auth.jwt()) ->> 'sub') AND (SELECT public.is_active_driver()))
    OR (
      driver_id IS NULL
      AND fulfillment_type = 'delivery'::text
      AND status = ANY (ARRAY[
        'pending'::orders_status_enum,
        'accepted'::orders_status_enum,
        'preparing'::orders_status_enum,
        'ready'::orders_status_enum
      ])
      AND public.can_driver_access_restaurant_pool(restaurant_id)
    )
    OR public.is_restaurant_owner(restaurant_id)
    OR (SELECT public.is_admin())
  );

ALTER POLICY orders_update_policy ON public.orders
  TO authenticated
  USING (
    client_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (driver_id = ((SELECT auth.jwt()) ->> 'sub') AND (SELECT public.is_active_driver()))
    OR (
      driver_id IS NULL
      AND fulfillment_type = 'delivery'::text
      AND status = ANY (ARRAY[
        'pending'::orders_status_enum,
        'accepted'::orders_status_enum,
        'preparing'::orders_status_enum,
        'ready'::orders_status_enum
      ])
      AND public.can_driver_access_restaurant_pool(restaurant_id)
    )
    OR public.is_restaurant_owner(restaurant_id)
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    client_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (driver_id = ((SELECT auth.jwt()) ->> 'sub') AND (SELECT public.is_active_driver()))
    OR public.is_restaurant_owner(restaurant_id)
    OR (SELECT public.is_admin())
  );

-- order_items
ALTER POLICY order_items_insert_policy ON public.order_items
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.client_id = ((SELECT auth.jwt()) ->> 'sub')
    )
  );

ALTER POLICY order_items_select_policy ON public.order_items
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_items.order_id
        AND (
          o.client_id = ((SELECT auth.jwt()) ->> 'sub')
          OR (o.driver_id = ((SELECT auth.jwt()) ->> 'sub') AND (SELECT public.is_active_driver()))
          OR (
            o.driver_id IS NULL
            AND o.fulfillment_type = 'delivery'::text
            AND o.status = ANY (ARRAY[
              'pending'::orders_status_enum,
              'accepted'::orders_status_enum,
              'preparing'::orders_status_enum,
              'ready'::orders_status_enum
            ])
            AND public.can_driver_access_restaurant_pool(o.restaurant_id)
          )
          OR public.is_restaurant_owner(o.restaurant_id)
          OR (SELECT public.is_admin())
        )
    )
  );

-- order_payments
ALTER POLICY order_payments_insert_policy ON public.order_payments
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_payments.order_id
        AND o.client_id = ((SELECT auth.jwt()) ->> 'sub')
    )
  );

ALTER POLICY order_payments_select_policy ON public.order_payments
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_payments.order_id
        AND (
          o.client_id = ((SELECT auth.jwt()) ->> 'sub')
          OR (o.driver_id = ((SELECT auth.jwt()) ->> 'sub') AND (SELECT public.is_active_driver()))
          OR (
            o.driver_id IS NULL
            AND o.fulfillment_type = 'delivery'::text
            AND o.status = ANY (ARRAY[
              'pending'::orders_status_enum,
              'accepted'::orders_status_enum,
              'preparing'::orders_status_enum,
              'ready'::orders_status_enum
            ])
            AND public.can_driver_access_restaurant_pool(o.restaurant_id)
          )
          OR public.is_restaurant_owner(o.restaurant_id)
          OR (SELECT public.is_admin())
        )
    )
  );

ALTER POLICY order_payments_update_policy ON public.order_payments
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = order_payments.order_id
        AND (
          o.client_id = ((SELECT auth.jwt()) ->> 'sub')
          OR public.is_restaurant_owner(o.restaurant_id)
          OR (SELECT public.is_admin())
        )
    )
  );

-- reviews
ALTER POLICY reviews_insert_policy ON public.reviews
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.id = reviews.order_id
        AND o.client_id = ((SELECT auth.jwt()) ->> 'sub')
        AND o.status = 'delivered'::orders_status_enum
    )
  );

ALTER POLICY reviews_update_policy ON public.reviews
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY reviews_delete_policy ON public.reviews
  TO authenticated
  USING ((SELECT public.is_admin()));

-- restaurant_drivers
ALTER POLICY restaurant_drivers_select_policy ON public.restaurant_drivers
  TO authenticated
  USING (
    driver_id = ((SELECT auth.jwt()) ->> 'sub')
    OR public.is_restaurant_owner(restaurant_id)
    OR (SELECT public.is_admin())
  );

ALTER POLICY restaurant_drivers_insert_policy ON public.restaurant_drivers
  TO authenticated
  WITH CHECK (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY restaurant_drivers_update_policy ON public.restaurant_drivers
  TO authenticated
  USING (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()))
  WITH CHECK (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY restaurant_drivers_delete_policy ON public.restaurant_drivers
  TO authenticated
  USING (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

-- restaurants & menus (InitPlan-safe updates in 0004; anon/auth split in 0005)
ALTER POLICY restaurants_select_policy ON public.restaurants
  USING (
    is_active = true
    OR owner_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (SELECT public.is_admin())
  );

ALTER POLICY restaurants_insert_policy ON public.restaurants
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY restaurants_update_policy ON public.restaurants
  TO authenticated
  USING (owner_id = ((SELECT auth.jwt()) ->> 'sub') OR (SELECT public.is_admin()))
  WITH CHECK (owner_id = ((SELECT auth.jwt()) ->> 'sub') OR (SELECT public.is_admin()));

ALTER POLICY restaurants_delete_policy ON public.restaurants
  TO authenticated
  USING ((SELECT public.is_admin()));

ALTER POLICY restaurant_delivery_config_select_policy ON public.restaurant_delivery_config
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_delivery_config.restaurant_id
        AND (
          r.is_active = true
          OR r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
          OR (SELECT public.is_admin())
        )
    )
  );

ALTER POLICY restaurant_delivery_config_insert_policy ON public.restaurant_delivery_config
  TO authenticated
  WITH CHECK (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY restaurant_delivery_config_update_policy ON public.restaurant_delivery_config
  TO authenticated
  USING (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()))
  WITH CHECK (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY restaurant_delivery_config_delete_policy ON public.restaurant_delivery_config
  TO authenticated
  USING (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_categories_select_policy ON public.menu_categories
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_categories.restaurant_id
        AND (
          r.is_active = true
          OR r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
          OR (SELECT public.is_admin())
        )
    )
  );

ALTER POLICY menu_categories_insert_policy ON public.menu_categories
  TO authenticated
  WITH CHECK (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_categories_update_policy ON public.menu_categories
  TO authenticated
  USING (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()))
  WITH CHECK (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_categories_delete_policy ON public.menu_categories
  TO authenticated
  USING (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_items_select_policy ON public.menu_items
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_items.restaurant_id
        AND (
          (r.is_active = true AND menu_items.is_active = true)
          OR r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
          OR (SELECT public.is_admin())
        )
    )
  );

ALTER POLICY menu_items_insert_policy ON public.menu_items
  TO authenticated
  WITH CHECK (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_items_update_policy ON public.menu_items
  TO authenticated
  USING (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()))
  WITH CHECK (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_items_delete_policy ON public.menu_items
  TO authenticated
  USING (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_option_groups_select_policy ON public.menu_option_groups
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_option_groups.restaurant_id
        AND (
          r.is_active = true
          OR r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
          OR (SELECT public.is_admin())
        )
    )
  );

ALTER POLICY menu_option_groups_insert_policy ON public.menu_option_groups
  TO authenticated
  WITH CHECK (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_option_groups_update_policy ON public.menu_option_groups
  TO authenticated
  USING (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()))
  WITH CHECK (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_option_groups_delete_policy ON public.menu_option_groups
  TO authenticated
  USING (public.is_restaurant_owner(restaurant_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_options_select_policy ON public.menu_options
  USING (
    EXISTS (
      SELECT 1
      FROM public.menu_option_groups mog
      JOIN public.restaurants r ON r.id = mog.restaurant_id
      WHERE mog.id = menu_options.group_id
        AND (
          r.is_active = true
          OR r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
          OR (SELECT public.is_admin())
        )
    )
  );

ALTER POLICY menu_options_insert_policy ON public.menu_options
  TO authenticated
  WITH CHECK (public.is_option_group_owner(group_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_options_update_policy ON public.menu_options
  TO authenticated
  USING (public.is_option_group_owner(group_id) OR (SELECT public.is_admin()))
  WITH CHECK (public.is_option_group_owner(group_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_options_delete_policy ON public.menu_options
  TO authenticated
  USING (public.is_option_group_owner(group_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_item_option_groups_select_policy ON public.menu_item_option_groups
  USING (
    EXISTS (
      SELECT 1
      FROM public.menu_items mi
      JOIN public.restaurants r ON r.id = mi.restaurant_id
      WHERE mi.id = menu_item_option_groups.menu_item_id
        AND (
          r.is_active = true
          OR r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
          OR (SELECT public.is_admin())
        )
    )
  );

ALTER POLICY menu_item_option_groups_insert_policy ON public.menu_item_option_groups
  TO authenticated
  WITH CHECK (public.is_menu_item_owner(menu_item_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_item_option_groups_update_policy ON public.menu_item_option_groups
  TO authenticated
  USING (public.is_menu_item_owner(menu_item_id) OR (SELECT public.is_admin()))
  WITH CHECK (public.is_menu_item_owner(menu_item_id) OR (SELECT public.is_admin()));

ALTER POLICY menu_item_option_groups_delete_policy ON public.menu_item_option_groups
  TO authenticated
  USING (public.is_menu_item_owner(menu_item_id) OR (SELECT public.is_admin()));

-- users (restrict from public to authenticated + InitPlan wrap)
ALTER POLICY "Admins full access on users" ON public.users
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY "Firebase - Usuarios gestionan su perfil" ON public.users
  TO authenticated
  USING (
    id = ((SELECT auth.jwt()) ->> 'sub')
    AND ((SELECT auth.jwt()) ->> 'iss') = 'https://securetoken.google.com/al-toque-delivery'
  )
  WITH CHECK (
    id = ((SELECT auth.jwt()) ->> 'sub')
    AND ((SELECT auth.jwt()) ->> 'iss') = 'https://securetoken.google.com/al-toque-delivery'
  );

-- Lookup tables & driver_profiles (InitPlan wrap in 0004; FOR ALL split via 0005)
ALTER POLICY driver_profiles_select_policy ON public.driver_profiles
  TO authenticated
  USING (
    user_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.restaurant_drivers rd
      WHERE rd.driver_id = driver_profiles.user_id
        AND public.is_restaurant_owner(rd.restaurant_id)
    )
  );

ALTER POLICY driver_profiles_admin_write_policy ON public.driver_profiles
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY categories_admin_manage ON public.categories
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY driver_types_admin_write_policy ON public.driver_types
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY payment_methods_admin_manage ON public.payment_methods
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY restaurant_categories_admin_manage ON public.restaurant_categories
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

ALTER POLICY roles_admin_manage ON public.roles
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));
