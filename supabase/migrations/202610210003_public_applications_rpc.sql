-- Funciones transaccionales seguras (SECURITY DEFINER) para que postulantes de la web
-- puedan enviar solicitudes de afiliación de restaurante y de repartidor sin requerir cuenta previa.

CREATE OR REPLACE FUNCTION public.submit_public_restaurant_application(
  p_business_name text,
  p_business_phone text,
  p_business_email text,
  p_address text,
  p_category_id uuid,
  p_city text,
  p_owner_name text,
  p_owner_dni text,
  p_additional_comments text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id public.users.id%TYPE;
  v_normalized_phone text;
  v_application_id uuid;
BEGIN
  -- Buscar usuario existente
  SELECT id INTO v_user_id
    FROM public.users
   WHERE phone = p_business_phone
      OR phone = '+51' || p_business_phone
      OR phone = replace(p_business_phone, '+51', '')
      OR (p_business_email IS NOT NULL AND p_business_email <> '' AND email = p_business_email)
   LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := 'web_' || replace(gen_random_uuid()::text, '-', '');
    IF p_business_phone ~ '^[0-9]{9}$' THEN
      v_normalized_phone := '+51' || p_business_phone;
    ELSE
      v_normalized_phone := p_business_phone;
    END IF;

    INSERT INTO public.users (
      id, name, phone, email, role_id, is_active, phone_verified, created_at, updated_at
    ) VALUES (
      v_user_id, p_owner_name, v_normalized_phone, NULLIF(p_business_email, ''), 1, true, false, now(), now()
    );
  END IF;

  INSERT INTO public.restaurant_applications (
    user_id,
    business_name,
    business_phone,
    business_email,
    address,
    category_id,
    city,
    owner_name,
    owner_dni,
    additional_comments,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_business_name,
    p_business_phone,
    NULLIF(p_business_email, ''),
    p_address,
    p_category_id,
    p_city::restaurant_applications_city_enum,
    p_owner_name,
    p_owner_dni,
    NULLIF(p_additional_comments, ''),
    'pending'::restaurant_applications_status_enum,
    now(),
    now()
  )
  RETURNING id INTO v_application_id;

  RETURN v_application_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_public_driver_application(
  p_full_name text,
  p_dni text,
  p_birth_date text,
  p_phone text,
  p_email text,
  p_vehicle_type text,
  p_vehicle_plate text,
  p_vehicle_brand text,
  p_vehicle_model text,
  p_license_number text,
  p_emergency_contact_name text,
  p_emergency_contact_phone text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
  v_user_id public.users.id%TYPE;
  v_normalized_phone text;
  v_application_id uuid;
BEGIN
  -- Buscar usuario existente
  SELECT id INTO v_user_id
    FROM public.users
   WHERE phone = p_phone
      OR phone = '+51' || p_phone
      OR phone = replace(p_phone, '+51', '')
      OR (p_email IS NOT NULL AND p_email <> '' AND email = p_email)
   LIMIT 1;

  IF v_user_id IS NULL THEN
    v_user_id := 'web_' || replace(gen_random_uuid()::text, '-', '');
    IF p_phone ~ '^[0-9]{9}$' THEN
      v_normalized_phone := '+51' || p_phone;
    ELSE
      v_normalized_phone := p_phone;
    END IF;

    INSERT INTO public.users (
      id, name, phone, email, role_id, is_active, phone_verified, created_at, updated_at
    ) VALUES (
      v_user_id, p_full_name, v_normalized_phone, NULLIF(p_email, ''), 1, true, false, now(), now()
    );
  END IF;

  INSERT INTO public.driver_applications (
    user_id,
    full_name,
    dni,
    birth_date,
    phone,
    email,
    vehicle_type,
    vehicle_plate,
    vehicle_brand,
    vehicle_model,
    license_number,
    emergency_contact_name,
    emergency_contact_phone,
    status,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_full_name,
    p_dni,
    p_birth_date::date,
    p_phone,
    NULLIF(p_email, ''),
    p_vehicle_type::driver_applications_vehicle_type_enum,
    NULLIF(p_vehicle_plate, ''),
    NULLIF(p_vehicle_brand, ''),
    NULLIF(p_vehicle_model, ''),
    NULLIF(p_license_number, ''),
    NULLIF(p_emergency_contact_name, ''),
    NULLIF(p_emergency_contact_phone, ''),
    'pending'::driver_applications_status_enum,
    now(),
    now()
  )
  RETURNING id INTO v_application_id;

  RETURN v_application_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.submit_public_restaurant_application TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.submit_public_driver_application TO anon, authenticated, service_role;
