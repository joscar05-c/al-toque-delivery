-- ============================================================================
-- Migration: 202611120002_delivery_pin_verification.sql
-- Purpose:
--   1. Add 4-digit `delivery_pin` column to `public.orders` (auto-generated).
--   2. Enforce PIN verification when a driver marks a delivery order as `delivered`.
--   3. Provide `public.driver_complete_delivery(p_order_id, p_pin)` RPC.
--   4. Include the 4-digit PIN in the `order_picked_up` push notification.
-- ============================================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS delivery_pin varchar(4) NOT NULL
  DEFAULT lpad((floor(random() * 9000) + 1000)::int::text, 4, '0');

-- ----------------------------------------------------------------------------
-- Trigger: Enforce PIN verification before transitioning delivery order -> delivered
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_enforce_delivery_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Keep delivery_pin immutable after creation
  IF TG_OP = 'UPDATE' THEN
    NEW.delivery_pin := OLD.delivery_pin;
  END IF;

  -- Enforce PIN verification when a driver transitions an order to 'delivered'
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_orders_enforce_delivery_pin'
      AND tgrelid = 'public.orders'::regclass
  ) THEN
    CREATE TRIGGER trg_orders_enforce_delivery_pin
      BEFORE UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_fn_enforce_delivery_pin();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- RPC: Complete delivery by validating the client's 4-digit PIN
-- ----------------------------------------------------------------------------
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
  v_driver_id text := (SELECT auth.jwt() ->> 'sub');
  v_clean_pin text := BTRIM(COALESCE(p_pin, ''));
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

  IF v_order.delivery_pin <> v_clean_pin THEN
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

-- ----------------------------------------------------------------------------
-- Update order notification trigger to include the 4-digit PIN on `picked_up`
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_notify_order_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_restaurant_name text := 'el restaurante';
  v_delivery_type text := 'platform';
  v_actor_id text := COALESCE(auth.jwt() ->> 'sub', '');
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
      INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
      VALUES (
        NEW.client_id,
        '¡Tu pedido va en camino!',
        format(
          'El repartidor ya recogió tu pedido de %s y se dirige a tu ubicación. Tu código PIN de entrega es %s.',
          v_restaurant_name,
          NEW.delivery_pin
        ),
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

