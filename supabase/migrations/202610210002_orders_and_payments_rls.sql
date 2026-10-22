-- 1. payment_methods: Lectura pública
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_methods_read_all"
  ON public.payment_methods
  FOR SELECT
  TO public
  USING (true);

-- 2. orders:
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_policy"
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    client_id = (auth.jwt() ->> 'sub')
    OR driver_id = (auth.jwt() ->> 'sub')
    OR EXISTS (
      SELECT 1 FROM public.restaurants r 
      WHERE r.id = orders.restaurant_id AND r.owner_id = (auth.jwt() ->> 'sub')
    )
    OR EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = (auth.jwt() ->> 'sub') AND u.role_id = 4
    )
  );

CREATE POLICY "orders_insert_policy"
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = (auth.jwt() ->> 'sub')
  );

CREATE POLICY "orders_update_policy"
  ON public.orders
  FOR UPDATE
  TO authenticated
  USING (
    client_id = (auth.jwt() ->> 'sub')
    OR driver_id = (auth.jwt() ->> 'sub')
    OR EXISTS (
      SELECT 1 FROM public.restaurants r 
      WHERE r.id = orders.restaurant_id AND r.owner_id = (auth.jwt() ->> 'sub')
    )
    OR EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = (auth.jwt() ->> 'sub') AND u.role_id = 4
    )
  );

CREATE POLICY "orders_delete_policy"
  ON public.orders
  FOR DELETE
  TO authenticated
  USING (
    client_id = (auth.jwt() ->> 'sub') AND status = 'pending'
  );

-- 3. order_items:
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_items_select_policy"
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_items.order_id AND (
        o.client_id = (auth.jwt() ->> 'sub')
        OR o.driver_id = (auth.jwt() ->> 'sub')
        OR EXISTS (
          SELECT 1 FROM public.restaurants r 
          WHERE r.id = o.restaurant_id AND r.owner_id = (auth.jwt() ->> 'sub')
        )
        OR EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = (auth.jwt() ->> 'sub') AND u.role_id = 4
        )
      )
    )
  );

CREATE POLICY "order_items_insert_policy"
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_items.order_id AND o.client_id = (auth.jwt() ->> 'sub')
    )
  );

-- 4. order_payments:
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "order_payments_select_policy"
  ON public.order_payments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_payments.order_id AND (
        o.client_id = (auth.jwt() ->> 'sub')
        OR o.driver_id = (auth.jwt() ->> 'sub')
        OR EXISTS (
          SELECT 1 FROM public.restaurants r 
          WHERE r.id = o.restaurant_id AND r.owner_id = (auth.jwt() ->> 'sub')
        )
        OR EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = (auth.jwt() ->> 'sub') AND u.role_id = 4
        )
      )
    )
  );

CREATE POLICY "order_payments_insert_policy"
  ON public.order_payments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_payments.order_id AND o.client_id = (auth.jwt() ->> 'sub')
    )
  );

CREATE POLICY "order_payments_update_policy"
  ON public.order_payments
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o 
      WHERE o.id = order_payments.order_id AND (
        o.client_id = (auth.jwt() ->> 'sub')
        OR EXISTS (
          SELECT 1 FROM public.restaurants r 
          WHERE r.id = o.restaurant_id AND r.owner_id = (auth.jwt() ->> 'sub')
        )
        OR EXISTS (
          SELECT 1 FROM public.users u 
          WHERE u.id = (auth.jwt() ->> 'sub') AND u.role_id = 4
        )
      )
    )
  );
