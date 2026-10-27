-- ============================================================================
-- Migración: Políticas de Seguridad Row-Level Security (RLS) e Índices
-- Tablas: restaurants, menu_categories, menu_items, menu_option_groups,
--         menu_options, menu_item_option_groups, restaurant_delivery_config,
--         restaurant_drivers, restaurant_categories, payment_methods
-- ============================================================================

-- 1. Funciones auxiliares STABLE y SECURITY DEFINER con search_path explícito
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = (auth.jwt() ->> 'sub')
      AND role_id = 4
  );
$$;

CREATE OR REPLACE FUNCTION public.is_restaurant_owner(p_restaurant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.restaurants
    WHERE id = p_restaurant_id
      AND owner_id = (auth.jwt() ->> 'sub')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_option_group_owner(p_group_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.menu_option_groups mog
    JOIN public.restaurants r ON r.id = mog.restaurant_id
    WHERE mog.id = p_group_id
      AND r.owner_id = (auth.jwt() ->> 'sub')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_menu_item_owner(p_menu_item_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.menu_items mi
    JOIN public.restaurants r ON r.id = mi.restaurant_id
    WHERE mi.id = p_menu_item_id
      AND r.owner_id = (auth.jwt() ->> 'sub')
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_restaurant_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_option_group_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_menu_item_owner(uuid) FROM anon;

-- 2. Índices de rendimiento para evaluar RLS y joins
CREATE INDEX IF NOT EXISTS idx_restaurants_owner_id ON public.restaurants(owner_id);
CREATE INDEX IF NOT EXISTS idx_restaurants_is_active ON public.restaurants(is_active);
CREATE INDEX IF NOT EXISTS idx_menu_categories_restaurant_id ON public.menu_categories(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON public.menu_items(menu_category_id);
CREATE INDEX IF NOT EXISTS idx_menu_option_groups_restaurant_id ON public.menu_option_groups(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_options_group_id ON public.menu_options(group_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_drivers_driver_id ON public.restaurant_drivers(driver_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_drivers_restaurant_id ON public.restaurant_drivers(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_delivery_config_restaurant_id ON public.restaurant_delivery_config(restaurant_id);

-- 3. Habilitación de RLS
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_delivery_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_option_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_item_option_groups ENABLE ROW LEVEL SECURITY;

-- 4. Limpieza de políticas previas
DROP POLICY IF EXISTS "restaurant_categories_select_policy" ON public.restaurant_categories;
DROP POLICY IF EXISTS "restaurant_categories_admin_manage" ON public.restaurant_categories;

DROP POLICY IF EXISTS "restaurants_select_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_insert_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_update_policy" ON public.restaurants;
DROP POLICY IF EXISTS "restaurants_delete_policy" ON public.restaurants;

DROP POLICY IF EXISTS "restaurant_delivery_config_select_policy" ON public.restaurant_delivery_config;
DROP POLICY IF EXISTS "restaurant_delivery_config_insert_policy" ON public.restaurant_delivery_config;
DROP POLICY IF EXISTS "restaurant_delivery_config_update_policy" ON public.restaurant_delivery_config;
DROP POLICY IF EXISTS "restaurant_delivery_config_delete_policy" ON public.restaurant_delivery_config;

DROP POLICY IF EXISTS "restaurant_drivers_select_policy" ON public.restaurant_drivers;
DROP POLICY IF EXISTS "restaurant_drivers_insert_policy" ON public.restaurant_drivers;
DROP POLICY IF EXISTS "restaurant_drivers_update_policy" ON public.restaurant_drivers;
DROP POLICY IF EXISTS "restaurant_drivers_delete_policy" ON public.restaurant_drivers;

DROP POLICY IF EXISTS "menu_categories_select_policy" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_insert_policy" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_update_policy" ON public.menu_categories;
DROP POLICY IF EXISTS "menu_categories_delete_policy" ON public.menu_categories;

DROP POLICY IF EXISTS "menu_items_select_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_insert_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_update_policy" ON public.menu_items;
DROP POLICY IF EXISTS "menu_items_delete_policy" ON public.menu_items;

DROP POLICY IF EXISTS "menu_option_groups_select_policy" ON public.menu_option_groups;
DROP POLICY IF EXISTS "menu_option_groups_insert_policy" ON public.menu_option_groups;
DROP POLICY IF EXISTS "menu_option_groups_update_policy" ON public.menu_option_groups;
DROP POLICY IF EXISTS "menu_option_groups_delete_policy" ON public.menu_option_groups;

DROP POLICY IF EXISTS "menu_options_select_policy" ON public.menu_options;
DROP POLICY IF EXISTS "menu_options_insert_policy" ON public.menu_options;
DROP POLICY IF EXISTS "menu_options_update_policy" ON public.menu_options;
DROP POLICY IF EXISTS "menu_options_delete_policy" ON public.menu_options;

DROP POLICY IF EXISTS "menu_item_option_groups_select_policy" ON public.menu_item_option_groups;
DROP POLICY IF EXISTS "menu_item_option_groups_insert_policy" ON public.menu_item_option_groups;
DROP POLICY IF EXISTS "menu_item_option_groups_update_policy" ON public.menu_item_option_groups;
DROP POLICY IF EXISTS "menu_item_option_groups_delete_policy" ON public.menu_item_option_groups;

DROP POLICY IF EXISTS "payment_methods_admin_manage" ON public.payment_methods;

-- 5. Creación de Políticas

-- restaurant_categories
CREATE POLICY "restaurant_categories_select_policy"
  ON public.restaurant_categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "restaurant_categories_admin_manage"
  ON public.restaurant_categories
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- restaurants
CREATE POLICY "restaurants_select_policy"
  ON public.restaurants
  FOR SELECT
  TO public
  USING (
    is_active = true
    OR owner_id = (auth.jwt() ->> 'sub')
    OR is_admin()
  );

CREATE POLICY "restaurants_insert_policy"
  ON public.restaurants
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_admin()
  );

CREATE POLICY "restaurants_update_policy"
  ON public.restaurants
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = (auth.jwt() ->> 'sub')
    OR is_admin()
  )
  WITH CHECK (
    owner_id = (auth.jwt() ->> 'sub')
    OR is_admin()
  );

CREATE POLICY "restaurants_delete_policy"
  ON public.restaurants
  FOR DELETE
  TO authenticated
  USING (
    is_admin()
  );

-- restaurant_delivery_config
CREATE POLICY "restaurant_delivery_config_select_policy"
  ON public.restaurant_delivery_config
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_delivery_config.restaurant_id
        AND (r.is_active = true OR r.owner_id = (auth.jwt() ->> 'sub') OR is_admin())
    )
  );

CREATE POLICY "restaurant_delivery_config_insert_policy"
  ON public.restaurant_delivery_config
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "restaurant_delivery_config_update_policy"
  ON public.restaurant_delivery_config
  FOR UPDATE
  TO authenticated
  USING (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  )
  WITH CHECK (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "restaurant_delivery_config_delete_policy"
  ON public.restaurant_delivery_config
  FOR DELETE
  TO authenticated
  USING (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

-- restaurant_drivers
CREATE POLICY "restaurant_drivers_select_policy"
  ON public.restaurant_drivers
  FOR SELECT
  TO authenticated
  USING (
    driver_id = (auth.jwt() ->> 'sub')
    OR is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "restaurant_drivers_insert_policy"
  ON public.restaurant_drivers
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "restaurant_drivers_update_policy"
  ON public.restaurant_drivers
  FOR UPDATE
  TO authenticated
  USING (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  )
  WITH CHECK (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "restaurant_drivers_delete_policy"
  ON public.restaurant_drivers
  FOR DELETE
  TO authenticated
  USING (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

-- menu_categories
CREATE POLICY "menu_categories_select_policy"
  ON public.menu_categories
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_categories.restaurant_id
        AND (r.is_active = true OR r.owner_id = (auth.jwt() ->> 'sub') OR is_admin())
    )
  );

CREATE POLICY "menu_categories_insert_policy"
  ON public.menu_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "menu_categories_update_policy"
  ON public.menu_categories
  FOR UPDATE
  TO authenticated
  USING (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  )
  WITH CHECK (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "menu_categories_delete_policy"
  ON public.menu_categories
  FOR DELETE
  TO authenticated
  USING (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

-- menu_items
CREATE POLICY "menu_items_select_policy"
  ON public.menu_items
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_items.restaurant_id
        AND ((r.is_active = true AND menu_items.is_active = true) OR r.owner_id = (auth.jwt() ->> 'sub') OR is_admin())
    )
  );

CREATE POLICY "menu_items_insert_policy"
  ON public.menu_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "menu_items_update_policy"
  ON public.menu_items
  FOR UPDATE
  TO authenticated
  USING (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  )
  WITH CHECK (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "menu_items_delete_policy"
  ON public.menu_items
  FOR DELETE
  TO authenticated
  USING (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

-- menu_option_groups
CREATE POLICY "menu_option_groups_select_policy"
  ON public.menu_option_groups
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_option_groups.restaurant_id
        AND (r.is_active = true OR r.owner_id = (auth.jwt() ->> 'sub') OR is_admin())
    )
  );

CREATE POLICY "menu_option_groups_insert_policy"
  ON public.menu_option_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "menu_option_groups_update_policy"
  ON public.menu_option_groups
  FOR UPDATE
  TO authenticated
  USING (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  )
  WITH CHECK (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

CREATE POLICY "menu_option_groups_delete_policy"
  ON public.menu_option_groups
  FOR DELETE
  TO authenticated
  USING (
    is_restaurant_owner(restaurant_id)
    OR is_admin()
  );

-- menu_options
CREATE POLICY "menu_options_select_policy"
  ON public.menu_options
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_option_groups mog
      JOIN public.restaurants r ON r.id = mog.restaurant_id
      WHERE mog.id = menu_options.group_id
        AND (r.is_active = true OR r.owner_id = (auth.jwt() ->> 'sub') OR is_admin())
    )
  );

CREATE POLICY "menu_options_insert_policy"
  ON public.menu_options
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_option_group_owner(group_id)
    OR is_admin()
  );

CREATE POLICY "menu_options_update_policy"
  ON public.menu_options
  FOR UPDATE
  TO authenticated
  USING (
    is_option_group_owner(group_id)
    OR is_admin()
  )
  WITH CHECK (
    is_option_group_owner(group_id)
    OR is_admin()
  );

CREATE POLICY "menu_options_delete_policy"
  ON public.menu_options
  FOR DELETE
  TO authenticated
  USING (
    is_option_group_owner(group_id)
    OR is_admin()
  );

-- menu_item_option_groups
CREATE POLICY "menu_item_option_groups_select_policy"
  ON public.menu_item_option_groups
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.menu_items mi
      JOIN public.restaurants r ON r.id = mi.restaurant_id
      WHERE mi.id = menu_item_option_groups.menu_item_id
        AND (r.is_active = true OR r.owner_id = (auth.jwt() ->> 'sub') OR is_admin())
    )
  );

CREATE POLICY "menu_item_option_groups_insert_policy"
  ON public.menu_item_option_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (
    is_menu_item_owner(menu_item_id)
    OR is_admin()
  );

CREATE POLICY "menu_item_option_groups_update_policy"
  ON public.menu_item_option_groups
  FOR UPDATE
  TO authenticated
  USING (
    is_menu_item_owner(menu_item_id)
    OR is_admin()
  )
  WITH CHECK (
    is_menu_item_owner(menu_item_id)
    OR is_admin()
  );

CREATE POLICY "menu_item_option_groups_delete_policy"
  ON public.menu_item_option_groups
  FOR DELETE
  TO authenticated
  USING (
    is_menu_item_owner(menu_item_id)
    OR is_admin()
  );

-- payment_methods
CREATE POLICY "payment_methods_admin_manage"
  ON public.payment_methods
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());
