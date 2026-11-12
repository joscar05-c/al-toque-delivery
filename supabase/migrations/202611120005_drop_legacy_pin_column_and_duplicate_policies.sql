-- ============================================================================
-- Migration: 202611120005_drop_legacy_pin_column_and_duplicate_policies.sql
-- Purpose (Destructive DROP cleanup - run manually in Supabase Dashboard > SQL Editor):
--   1. Drop redundant `public.orders.delivery_pin` column after backfill to
--      `public.order_delivery_pins`.
--   2. Split `TO public` catalog/menu SELECT policies cleanly into `anon` vs
--      `authenticated` and revoke `EXECUTE ON FUNCTION public.is_admin()` from `anon`.
--   3. Consolidate `multiple_permissive_policies` on `users`, `driver_profiles`,
--      `categories`, `driver_types`, `payment_methods`, `restaurant_categories`,
--      and `roles` by replacing overlapping `FOR ALL` policies with explicit
--      INSERT/UPDATE/DELETE policies.
-- ============================================================================

-- 1. Drop legacy delivery_pin column from public.orders
ALTER TABLE public.orders DROP COLUMN IF EXISTS delivery_pin;

-- 2. Split catalog & menu SELECT policies cleanly to anon vs authenticated
DROP POLICY IF EXISTS restaurants_select_policy ON public.restaurants;
CREATE POLICY restaurants_select_anon_policy
  ON public.restaurants
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE POLICY restaurants_select_authenticated_policy
  ON public.restaurants
  FOR SELECT
  TO authenticated
  USING (
    is_active = true
    OR owner_id = ((SELECT auth.jwt()) ->> 'sub')
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS restaurant_delivery_config_select_policy ON public.restaurant_delivery_config;
CREATE POLICY restaurant_delivery_config_select_anon_policy
  ON public.restaurant_delivery_config
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = restaurant_delivery_config.restaurant_id AND r.is_active = true
    )
  );

CREATE POLICY restaurant_delivery_config_select_authenticated_policy
  ON public.restaurant_delivery_config
  FOR SELECT
  TO authenticated
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

DROP POLICY IF EXISTS menu_categories_select_policy ON public.menu_categories;
CREATE POLICY menu_categories_select_anon_policy
  ON public.menu_categories
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_categories.restaurant_id AND r.is_active = true
    )
  );

CREATE POLICY menu_categories_select_authenticated_policy
  ON public.menu_categories
  FOR SELECT
  TO authenticated
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

DROP POLICY IF EXISTS menu_items_select_policy ON public.menu_items;
CREATE POLICY menu_items_select_anon_policy
  ON public.menu_items
  FOR SELECT
  TO anon
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_items.restaurant_id AND r.is_active = true
    )
  );

CREATE POLICY menu_items_select_authenticated_policy
  ON public.menu_items
  FOR SELECT
  TO authenticated
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

DROP POLICY IF EXISTS menu_option_groups_select_policy ON public.menu_option_groups;
CREATE POLICY menu_option_groups_select_anon_policy
  ON public.menu_option_groups
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1 FROM public.restaurants r
      WHERE r.id = menu_option_groups.restaurant_id AND r.is_active = true
    )
  );

CREATE POLICY menu_option_groups_select_authenticated_policy
  ON public.menu_option_groups
  FOR SELECT
  TO authenticated
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

DROP POLICY IF EXISTS menu_options_select_policy ON public.menu_options;
CREATE POLICY menu_options_select_anon_policy
  ON public.menu_options
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.menu_option_groups mog
      JOIN public.restaurants r ON r.id = mog.restaurant_id
      WHERE mog.id = menu_options.group_id AND r.is_active = true
    )
  );

CREATE POLICY menu_options_select_authenticated_policy
  ON public.menu_options
  FOR SELECT
  TO authenticated
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

DROP POLICY IF EXISTS menu_item_option_groups_select_policy ON public.menu_item_option_groups;
CREATE POLICY menu_item_option_groups_select_anon_policy
  ON public.menu_item_option_groups
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.menu_items mi
      JOIN public.restaurants r ON r.id = mi.restaurant_id
      WHERE mi.id = menu_item_option_groups.menu_item_id AND r.is_active = true
    )
  );

CREATE POLICY menu_item_option_groups_select_authenticated_policy
  ON public.menu_item_option_groups
  FOR SELECT
  TO authenticated
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

-- Now safe to revoke `is_admin()` from `anon` because no `TO public` policy calls it
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

-- 3. Consolidate `multiple_permissive_policies` on users, driver_profiles & lookup tables
DROP POLICY IF EXISTS "Admins full access on users" ON public.users;
DROP POLICY IF EXISTS "Firebase - Usuarios gestionan su perfil" ON public.users;
CREATE POLICY users_authenticated_access_policy
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    (SELECT public.is_admin())
    OR (
      id = ((SELECT auth.jwt()) ->> 'sub')
      AND ((SELECT auth.jwt()) ->> 'iss') = 'https://securetoken.google.com/al-toque-delivery'
    )
  )
  WITH CHECK (
    (SELECT public.is_admin())
    OR (
      id = ((SELECT auth.jwt()) ->> 'sub')
      AND ((SELECT auth.jwt()) ->> 'iss') = 'https://securetoken.google.com/al-toque-delivery'
    )
  );

DROP POLICY IF EXISTS driver_profiles_admin_write_policy ON public.driver_profiles;
CREATE POLICY driver_profiles_admin_insert_policy
  ON public.driver_profiles FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY driver_profiles_admin_update_policy
  ON public.driver_profiles FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY driver_profiles_admin_delete_policy
  ON public.driver_profiles FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS categories_admin_manage ON public.categories;
CREATE POLICY categories_admin_insert_policy
  ON public.categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY categories_admin_update_policy
  ON public.categories FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY categories_admin_delete_policy
  ON public.categories FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS driver_types_admin_write_policy ON public.driver_types;
CREATE POLICY driver_types_admin_insert_policy
  ON public.driver_types FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY driver_types_admin_update_policy
  ON public.driver_types FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY driver_types_admin_delete_policy
  ON public.driver_types FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS payment_methods_admin_manage ON public.payment_methods;
CREATE POLICY payment_methods_admin_insert_policy
  ON public.payment_methods FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY payment_methods_admin_update_policy
  ON public.payment_methods FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY payment_methods_admin_delete_policy
  ON public.payment_methods FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS restaurant_categories_admin_manage ON public.restaurant_categories;
CREATE POLICY restaurant_categories_admin_insert_policy
  ON public.restaurant_categories FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY restaurant_categories_admin_update_policy
  ON public.restaurant_categories FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY restaurant_categories_admin_delete_policy
  ON public.restaurant_categories FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS roles_admin_manage ON public.roles;
CREATE POLICY roles_admin_insert_policy
  ON public.roles FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY roles_admin_update_policy
  ON public.roles FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin())) WITH CHECK ((SELECT public.is_admin()));
CREATE POLICY roles_admin_delete_policy
  ON public.roles FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

