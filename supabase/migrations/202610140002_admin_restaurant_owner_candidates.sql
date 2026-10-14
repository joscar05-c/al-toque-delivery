-- Lista perfiles elegibles para el formulario admin sin depender de SELECT
-- global sobre users/restaurants, que puede estar limitado por RLS.
CREATE OR REPLACE FUNCTION public.admin_list_restaurant_owner_candidates()
RETURNS TABLE (
  id text,
  name text,
  email text,
  phone text,
  role_id integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM public.users AS admin_user
     WHERE admin_user.id::text = (auth.jwt() ->> 'sub')
       AND admin_user.role_id = 4
  ) THEN
    RAISE EXCEPTION 'Se requiere rol administrador para listar propietarios'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT candidate.id::text,
         candidate.name::text,
         candidate.email::text,
         candidate.phone::text,
         candidate.role_id
    FROM public.users AS candidate
   WHERE candidate.role_id IN (1, 3)
     AND NOT EXISTS (
       SELECT 1
         FROM public.restaurants AS restaurant
        WHERE restaurant.owner_id::text = candidate.id::text
     )
   ORDER BY candidate.name;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_list_restaurant_owner_candidates() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_restaurant_owner_candidates() TO authenticated;

NOTIFY pgrst, 'reload schema';
