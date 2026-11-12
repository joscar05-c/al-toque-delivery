-- ============================================================================
-- Migration: 202611120001_push_notifications_system.sql
-- Purpose:
--   1. Enable pg_net for asynchronous HTTP calls to Supabase Edge Functions.
--   2. Create normalized public.notifications table with RLS & indexes.
--   3. Create triggers on public.orders and public.driver_applications to
--      generate real-time notifications for clients and drivers.
--   4. Dispatch push notifications via Edge Function `send-push` (FCM HTTP v1).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_net;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  type text NOT NULL,
  reference_id text NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
  ON public.notifications (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id)
  WHERE is_read = false;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_select_own_or_admin'
  ) THEN
    CREATE POLICY notifications_select_own_or_admin
      ON public.notifications
      FOR SELECT
      TO authenticated
      USING (
        user_id = (SELECT auth.jwt() ->> 'sub')
        OR (SELECT public.is_admin())
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'notifications'
      AND policyname = 'notifications_update_own_or_admin'
  ) THEN
    CREATE POLICY notifications_update_own_or_admin
      ON public.notifications
      FOR UPDATE
      TO authenticated
      USING (
        user_id = (SELECT auth.jwt() ->> 'sub')
        OR (SELECT public.is_admin())
      )
      WITH CHECK (
        user_id = (SELECT auth.jwt() ->> 'sub')
        OR (SELECT public.is_admin())
      );
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Trigger 1: Dispatch newly inserted notification to Edge Function `send-push`
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_dispatch_push_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, net, pg_temp
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://zevxgrjcoctpukbbiibn.supabase.co/functions/v1/send-push',
    body := jsonb_build_object('notification_id', NEW.id),
    headers := '{"Content-Type": "application/json"}'::jsonb,
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_fn_dispatch_push_notification() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_fn_dispatch_push_notification() TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_notifications_dispatch_push'
      AND tgrelid = 'public.notifications'::regclass
  ) THEN
    CREATE TRIGGER trg_notifications_dispatch_push
      AFTER INSERT ON public.notifications
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_fn_dispatch_push_notification();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Trigger 2: Generate notifications on order status & driver assignment changes
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

  -- Case A: INSERT with an already assigned driver
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

  -- Case B: UPDATE — Driver newly assigned or reassigned
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

  -- Case C: UPDATE — Order status changed
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
        -- Delivery order is ready
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
          -- Notify online platform drivers
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
        format('El repartidor ya recogió tu pedido de %s y se dirige a tu ubicación.', v_restaurant_name),
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

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_orders_notify_events'
      AND tgrelid = 'public.orders'::regclass
  ) THEN
    CREATE TRIGGER trg_orders_notify_events
      AFTER INSERT OR UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_fn_notify_order_events();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Trigger 3: Generate notifications on driver application review
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_notify_driver_application_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.user_id IS NOT NULL THEN
    IF NEW.status = 'approved' THEN
      INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
      VALUES (
        NEW.user_id,
        '¡Solicitud de repartidor aprobada!',
        'Tu cuenta de repartidor ha sido activada. Ya puedes conectarte para recibir pedidos.',
        'driver_application_approved',
        NEW.id::text,
        jsonb_build_object(
          'applicationId', NEW.id,
          'target', 'driver_home',
          'status', NEW.status
        )
      );
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO public.notifications (user_id, title, body, type, reference_id, data)
      VALUES (
        NEW.user_id,
        'Actualización sobre tu solicitud de repartidor',
        COALESCE(
          'Motivo: ' || NULLIF(BTRIM(NEW.rejection_reason), ''),
          'Tu solicitud de repartidor fue observada. Revisa los detalles en la app.'
        ),
        'driver_application_rejected',
        NEW.id::text,
        jsonb_build_object(
          'applicationId', NEW.id,
          'target', 'driver_application',
          'status', NEW.status
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.trg_fn_notify_driver_application_events() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trg_fn_notify_driver_application_events() TO service_role;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_driver_applications_notify_events'
      AND tgrelid = 'public.driver_applications'::regclass
  ) THEN
    CREATE TRIGGER trg_driver_applications_notify_events
      AFTER UPDATE ON public.driver_applications
      FOR EACH ROW
      EXECUTE FUNCTION public.trg_fn_notify_driver_application_events();
  END IF;
END $$;

-- ----------------------------------------------------------------------------
-- Realtime Publication: Ensure order_payments and notifications broadcast live
-- ----------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'order_payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_payments;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
