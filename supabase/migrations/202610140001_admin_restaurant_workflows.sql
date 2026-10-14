-- Transaccional: aprobar solicitud -> restaurante + solicitud aprobada + rol owner.
-- El UID de Firebase se trata como texto (JWT sub), no se asume que sea UUID.
CREATE OR REPLACE FUNCTION public.admin_approve_restaurant_application(
  p_application_id text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_admin_id public.users.id%TYPE;
  v_owner_id public.users.id%TYPE;
  v_owner_role_id integer;
  v_application public.restaurant_applications%ROWTYPE;
  v_restaurant_id public.restaurants.id%TYPE;
BEGIN
  SELECT u.id
    INTO v_admin_id
    FROM public.users AS u
   WHERE u.id::text = (auth.jwt() ->> 'sub')
     AND u.role_id = 4;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Se requiere rol administrador para aprobar solicitudes'
      USING ERRCODE = '42501';
  END IF;

  SELECT ra.*
    INTO v_application
    FROM public.restaurant_applications AS ra
   WHERE ra.id::text = p_application_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Solicitud de restaurante no encontrada'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_application.status::text <> 'pending' THEN
    RAISE EXCEPTION 'La solicitud ya fue procesada'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_application.restaurant_id IS NOT NULL THEN
    RAISE EXCEPTION 'La solicitud ya tiene un restaurante asociado'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT u.id, u.role_id
    INTO v_owner_id, v_owner_role_id
    FROM public.users AS u
   WHERE u.id::text = v_application.user_id::text
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se encontró el usuario solicitante'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_owner_role_id IS NULL OR v_owner_role_id NOT IN (1, 3) THEN
    RAISE EXCEPTION 'El solicitante no tiene un rol que pueda ser propietario'
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.restaurants AS r
     WHERE r.owner_id::text = v_owner_id::text
  ) THEN
    RAISE EXCEPTION 'El usuario ya tiene un restaurante asociado'
      USING ERRCODE = 'P0001';
  END IF;

  INSERT INTO public.restaurants (
    name,
    address,
    phone,
    city,
    is_active,
    owner_id,
    average_prep_time,
    restaurant_category_id
  )
  VALUES (
    v_application.business_name,
    v_application.address,
    v_application.business_phone,
    v_application.city::text::public.restaurants_city_enum,
    true,
    v_owner_id,
    30,
    v_application.category_id
  )
  RETURNING id INTO v_restaurant_id;

  UPDATE public.restaurant_applications
     SET status = 'approved',
         reviewed_by = v_admin_id,
         reviewed_at = now(),
         restaurant_id = v_restaurant_id,
         updated_at = now()
   WHERE id = v_application.id;

  UPDATE public.users
     SET role_id = 3,
         updated_at = now()
   WHERE id = v_owner_id;

  RETURN v_restaurant_id::text;
END;
$function$;

-- Creación directa desde el panel. Requiere una cuenta Firebase ya registrada
-- y no permite asignar más de un restaurante al mismo propietario.
CREATE OR REPLACE FUNCTION public.admin_create_restaurant(
  p_owner_id text,
  p_name text,
  p_address text,
  p_phone text,
  p_city text,
  p_category_id text DEFAULT NULL,
  p_average_prep_time integer DEFAULT 30
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_admin_id public.users.id%TYPE;
  v_owner_id public.users.id%TYPE;
  v_owner_role_id integer;
  v_category_id public.restaurant_categories.id%TYPE;
  v_restaurant_id public.restaurants.id%TYPE;
BEGIN
  SELECT u.id
    INTO v_admin_id
    FROM public.users AS u
   WHERE u.id::text = (auth.jwt() ->> 'sub')
     AND u.role_id = 4;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Se requiere rol administrador para crear restaurantes'
      USING ERRCODE = '42501';
  END IF;

  IF nullif(trim(p_owner_id), '') IS NULL
     OR nullif(trim(p_name), '') IS NULL
     OR nullif(trim(p_address), '') IS NULL
     OR nullif(trim(p_phone), '') IS NULL THEN
    RAISE EXCEPTION 'Propietario, nombre, dirección y teléfono son obligatorios'
      USING ERRCODE = 'P0001';
  END IF;

  IF p_city IS NULL OR p_city NOT IN ('bagua', 'jaen', 'chachapoyas', 'other') THEN
    RAISE EXCEPTION 'Ciudad no válida'
      USING ERRCODE = 'P0001';
  END IF;

  IF p_average_prep_time IS NULL OR p_average_prep_time < 1 THEN
    RAISE EXCEPTION 'El tiempo promedio de preparación debe ser mayor a cero'
      USING ERRCODE = 'P0001';
  END IF;

  SELECT u.id, u.role_id
    INTO v_owner_id, v_owner_role_id
    FROM public.users AS u
   WHERE u.id::text = p_owner_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'El propietario debe tener una cuenta registrada en la aplicación'
      USING ERRCODE = 'P0001';
  END IF;

  IF v_owner_role_id IS NULL OR v_owner_role_id NOT IN (1, 3) THEN
    RAISE EXCEPTION 'Solo se puede asignar el restaurante a un cliente o propietario'
      USING ERRCODE = 'P0001';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM public.restaurants AS r
     WHERE r.owner_id::text = v_owner_id::text
  ) THEN
    RAISE EXCEPTION 'El usuario ya tiene un restaurante asociado'
      USING ERRCODE = 'P0001';
  END IF;

  IF nullif(trim(p_category_id), '') IS NOT NULL THEN
    SELECT c.id
      INTO v_category_id
      FROM public.restaurant_categories AS c
     WHERE c.id::text = p_category_id
       AND c."isActive" = true;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'La categoría no existe o está inactiva'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.restaurants (
    name,
    address,
    phone,
    city,
    is_active,
    owner_id,
    average_prep_time,
    restaurant_category_id
  )
  VALUES (
    trim(p_name),
    trim(p_address),
    trim(p_phone),
    p_city::public.restaurants_city_enum,
    true,
    v_owner_id,
    p_average_prep_time,
    v_category_id
  )
  RETURNING id INTO v_restaurant_id;

  UPDATE public.users
     SET role_id = 3,
         updated_at = now()
   WHERE id = v_owner_id;

  RETURN v_restaurant_id::text;
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_approve_restaurant_application(text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_create_restaurant(text, text, text, text, text, text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_approve_restaurant_application(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_create_restaurant(text, text, text, text, text, text, integer) TO authenticated;

NOTIFY pgrst, 'reload schema';
