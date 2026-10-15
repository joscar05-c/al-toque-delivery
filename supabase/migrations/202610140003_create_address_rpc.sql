-- Función RPC para crear direcciones con PostGIS correctamente
-- Convierte lat/lng a geography(Point, 4326) usando ST_Point

CREATE OR REPLACE FUNCTION create_address(
  p_user_id UUID,
  p_street TEXT,
  p_city TEXT,
  p_postal_code TEXT,
  p_reference TEXT,
  p_type addresses_type_enum,
  p_is_default BOOLEAN,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION
)
RETURNS SETOF addresses
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Si es la dirección predeterminada, limpiar el flag de otras direcciones del usuario
  IF p_is_default THEN
    UPDATE addresses
    SET is_default = FALSE
    WHERE user_id = p_user_id AND is_default = TRUE;
  END IF;

  -- Insertar la nueva dirección con el punto geográfico convertido correctamente
  RETURN QUERY
  INSERT INTO addresses (
    user_id,
    street,
    city,
    postal_code,
    reference,
    type,
    is_default,
    location
  )
  VALUES (
    p_user_id,
    p_street,
    p_city,
    p_postal_code,
    p_reference,
    p_type,
    p_is_default,
    ST_Point(p_longitude, p_latitude)::geography
  )
  RETURNING *;
END;
$$;
