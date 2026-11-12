-- ============================================================================
-- Migration: 202611120003_scheduled_cleanup_maintenance.sql
-- Purpose:
--   1. Enable pg_cron for automated database maintenance.
--   2. Add partial index for inactive device tokens cleanup.
--   3. Create `public.purge_stale_notifications_and_tokens` maintenance function.
--   4. Schedule daily cron job `al-toque-daily-cleanup` (04:00 UTC / 23:00 PET).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE INDEX IF NOT EXISTS idx_device_tokens_inactive_updated
  ON public.device_tokens (updated_at)
  WHERE "isActive" = false;

CREATE OR REPLACE FUNCTION public.purge_stale_notifications_and_tokens(
  p_read_days int DEFAULT 60,
  p_unread_days int DEFAULT 120,
  p_inactive_token_days int DEFAULT 60
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted_notifications int := 0;
  v_deleted_tokens int := 0;
BEGIN
  DELETE FROM public.notifications
   WHERE (is_read = true AND created_at < now() - make_interval(days => GREATEST(p_read_days, 7)))
      OR (is_read = false AND created_at < now() - make_interval(days => GREATEST(p_unread_days, 30)));
  GET DIAGNOSTICS v_deleted_notifications = ROW_COUNT;

  DELETE FROM public.device_tokens
   WHERE "isActive" = false
     AND updated_at < now() - make_interval(days => GREATEST(p_inactive_token_days, 14));
  GET DIAGNOSTICS v_deleted_tokens = ROW_COUNT;

  RETURN jsonb_build_object(
    'deleted_notifications', v_deleted_notifications,
    'deleted_device_tokens', v_deleted_tokens,
    'executed_at', now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.purge_stale_notifications_and_tokens(int, int, int)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_stale_notifications_and_tokens(int, int, int)
  TO postgres, service_role;

SELECT cron.schedule(
  'al-toque-daily-cleanup',
  '0 4 * * *',
  $$SELECT public.purge_stale_notifications_and_tokens(60, 120, 60);$$
);

