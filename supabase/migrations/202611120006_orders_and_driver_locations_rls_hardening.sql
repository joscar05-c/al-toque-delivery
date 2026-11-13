-- =============================================================================
-- Migración: 202611120006_orders_and_driver_locations_rls_hardening.sql
-- Descripción:
--   1. Endurece `orders_update_policy` para exigir que la toma de pedidos del
--      pool pase por `public.driver_claim_order` y que los clientes solo puedan
--      actualizar sus propios pedidos cuando estén en `'pending'`.
--   2. Amplía el trigger `BEFORE UPDATE` `public.trg_fn_enforce_delivery_pin`
--      en `public.orders` para impedir que clientes o repartidores alteren
--      montos, restaurante, cliente, dirección, método de pago o salten a
--      estados no autorizados.
--   3. Restringe `driver_locations_select_policy` para que clientes y dueños de
--      restaurante solo consulten la ubicación GPS en vivo mientras el pedido
--      esté en curso (`'accepted'`, `'preparing'`, `'ready'`, `'picked_up'`)
--      o el repartidor esté activo en la flota del restaurante (`rd.is_active = true`).
--   4. Revoca permisos `EXECUTE` innecesarios para `PUBLIC`, `anon` y
--      `authenticated` en funciones administrativas/internas `SECURITY DEFINER`
--      que solo deben ser invocadas por `service_role` o triggers internos.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Endurecer política UPDATE en public.orders
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "orders_update_policy" ON public.orders;
CREATE POLICY "orders_update_policy"
  ON public.orders
  FOR UPDATE
  USING (
    (
      client_id = ((SELECT auth.jwt()) ->> 'sub')
      AND status = 'pending'::public.orders_status_enum
    )
    OR (
      driver_id = ((SELECT auth.jwt()) ->> 'sub')
      AND (SELECT public.is_active_driver())
    )
    OR public.is_restaurant_owner(restaurant_id)
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    (
      client_id = ((SELECT auth.jwt()) ->> 'sub')
      AND status = 'cancelled'::public.orders_status_enum
    )
    OR (
      driver_id = ((SELECT auth.jwt()) ->> 'sub')
      AND (SELECT public.is_active_driver())
    )
    OR public.is_restaurant_owner(restaurant_id)
    OR (SELECT public.is_admin())
  );

-- -----------------------------------------------------------------------------
-- 2. Endurecer trigger BEFORE UPDATE en public.orders (inmutabilidad y PIN)
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_fn_enforce_delivery_pin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_uid text;
  v_is_privileged boolean;
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;

  v_uid := (SELECT auth.jwt()) ->> 'sub';
  v_is_privileged := (
    COALESCE(auth.role(), '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
    OR (SELECT public.is_admin())
    OR (
      OLD.restaurant_id IS NOT NULL
      AND (SELECT public.is_restaurant_owner(OLD.restaurant_id))
    )
  );

  -- Si el actor no es privilegiado (cliente o repartidor autenticado vía RLS):
  IF NOT v_is_privileged THEN
    -- Prohibir alteración de columnas críticas/financieras/propiedad
    IF NEW.client_id IS DISTINCT FROM OLD.client_id
       OR NEW.restaurant_id IS DISTINCT FROM OLD.restaurant_id
       OR NEW.total IS DISTINCT FROM OLD.total
       OR NEW.delivery_fee IS DISTINCT FROM OLD.delivery_fee
       OR NEW.payment_method IS DISTINCT FROM OLD.payment_method
       OR NEW.cash_tendered_amount IS DISTINCT FROM OLD.cash_tendered_amount
       OR NEW.fulfillment_type IS DISTINCT FROM OLD.fulfillment_type
       OR NEW.delivery_address IS DISTINCT FROM OLD.delivery_address
       OR NEW.delivery_latitude IS DISTINCT FROM OLD.delivery_latitude
       OR NEW.delivery_longitude IS DISTINCT FROM OLD.delivery_longitude
       OR NEW.notes IS DISTINCT FROM OLD.notes
    THEN
      RAISE EXCEPTION 'No tienes permiso para modificar los datos financieros o de destino del pedido.';
    END IF;

    -- Reglas para el repartidor asignado
    IF OLD.driver_id IS NOT NULL AND OLD.driver_id = v_uid THEN
      IF NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
        RAISE EXCEPTION 'No puedes reasignar el repartidor del pedido.';
      END IF;

      IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NEW.status = 'picked_up' THEN
          IF OLD.status NOT IN ('accepted', 'preparing', 'ready') THEN
            RAISE EXCEPTION 'El pedido no puede marcarse como recogido desde el estado actual (%).', OLD.status;
          END IF;
        ELSIF NEW.status = 'delivered' THEN
          IF OLD.status NOT IN ('ready', 'picked_up') THEN
            RAISE EXCEPTION 'El pedido debe estar listo o en camino antes de marcarse como entregado.';
          END IF;
        ELSE
          RAISE EXCEPTION 'Transición de estado no permitida para el repartidor (% -> %).', OLD.status, NEW.status;
        END IF;
      END IF;

    -- Reglas para el cliente titular del pedido
    ELSIF OLD.client_id = v_uid THEN
      IF NEW.driver_id IS DISTINCT FROM OLD.driver_id THEN
        RAISE EXCEPTION 'No puedes modificar el repartidor del pedido.';
      END IF;

      IF OLD.status <> 'pending' OR NEW.status <> 'cancelled' THEN
        RAISE EXCEPTION 'Solo puedes cancelar un pedido mientras aún está pendiente de confirmación.';
      END IF;
    ELSE
      RAISE EXCEPTION 'No tienes autorización para actualizar este pedido.';
    END IF;
  END IF;

  -- Verificación obligatoria de PIN de 4 dígitos para pasar a 'delivered' en delivery
  IF NEW.status = 'delivered'
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

-- -----------------------------------------------------------------------------
-- 3. Restringir exposición de ubicación GPS en public.driver_locations
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "driver_locations_select_policy" ON public.driver_locations;
CREATE POLICY "driver_locations_select_policy"
  ON public.driver_locations
  FOR SELECT
  USING (
    driver_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (SELECT public.is_admin())
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      WHERE o.driver_id = driver_locations.driver_id
        AND o.client_id = ((SELECT auth.jwt()) ->> 'sub')
        AND o.status IN (
          'accepted'::public.orders_status_enum,
          'preparing'::public.orders_status_enum,
          'ready'::public.orders_status_enum,
          'picked_up'::public.orders_status_enum
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.orders o
      JOIN public.restaurants r ON r.id = o.restaurant_id
      WHERE o.driver_id = driver_locations.driver_id
        AND r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
        AND o.status IN (
          'accepted'::public.orders_status_enum,
          'preparing'::public.orders_status_enum,
          'ready'::public.orders_status_enum,
          'picked_up'::public.orders_status_enum
        )
    )
    OR EXISTS (
      SELECT 1
      FROM public.restaurant_drivers rd
      JOIN public.restaurants r ON r.id = rd.restaurant_id
      WHERE rd.driver_id = driver_locations.driver_id
        AND rd.is_active = true
        AND r.owner_id = ((SELECT auth.jwt()) ->> 'sub')
    )
  );

-- -----------------------------------------------------------------------------
-- 4. Revocar EXECUTE en funciones administrativas/internas SECURITY DEFINER
-- -----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.submit_public_driver_application(text, text, text, text, text, text, text, text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_driver_application(text, text, text, text, text, text, text, text, text, text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.submit_public_restaurant_application(text, text, text, text, uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_public_restaurant_application(text, text, text, text, uuid, text, text, text, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.admin_approve_driver_application(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_driver_application(uuid, text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.admin_approve_restaurant_application(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_restaurant_application(text) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.admin_create_restaurant(text, text, text, text, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_create_restaurant(text, text, text, text, text, text, integer) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.admin_list_restaurant_owner_candidates() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_restaurant_owner_candidates() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.auto_assign_restaurant_driver(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.auto_assign_restaurant_driver(uuid) TO authenticated, service_role;

COMMIT;

