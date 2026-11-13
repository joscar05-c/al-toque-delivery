-- =============================================================================
-- Migración: 202611120007_protect_user_role_and_restore_admin.sql
-- Descripción:
--   1. Restaura `role_id = 4` (Super Admin) para la cuenta administradora
--      principal (`djOeQqndk2VNgz31kbd5gsENNp52` / `+51910644505`), cuyo rol
--      había sido sobreescrito a `1` por el fallback `.upsert()` de la app móvil.
--   2. Añade el trigger `BEFORE UPDATE` `trg_protect_user_sensitive_columns`
--      en `public.users` para impedir que cualquier cliente autenticado no
--      administrador altere su propio `role_id` o `is_active` mediante `UPDATE`
--      o `UPSERT`.
-- =============================================================================

BEGIN;

-- 1. Restaurar rol de Super Admin (role_id = 4) en la cuenta principal
UPDATE public.users
SET role_id = 4,
    is_active = true,
    updated_at = now()
WHERE id = 'djOeQqndk2VNgz31kbd5gsENNp52';

-- 2. Proteger columnas sensibles (role_id, is_active) en public.users
CREATE OR REPLACE FUNCTION public.trg_fn_protect_user_sensitive_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_privileged boolean;
BEGIN
  v_is_privileged := (
    COALESCE(auth.role(), '') = 'service_role'
    OR current_user IN ('postgres', 'supabase_admin')
    OR (SELECT public.is_admin())
  );

  IF NOT v_is_privileged THEN
    -- Preservar el rol y estado activo actuales frente a upserts/updates del cliente
    NEW.role_id := OLD.role_id;
    NEW.is_active := OLD.is_active;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_user_sensitive_columns ON public.users;
CREATE TRIGGER trg_protect_user_sensitive_columns
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_fn_protect_user_sensitive_columns();

COMMIT;

