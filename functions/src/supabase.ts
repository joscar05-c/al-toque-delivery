import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { defineSecret } from 'firebase-functions/params';

export const supabaseServiceRoleKey = defineSecret('SUPABASE_SERVICE_ROLE_KEY');

/**
 * Cliente Supabase con service_role: se salta RLS.
 * Solo se usa en el backend (Cloud Functions). NUNCA exponer esta key.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = supabaseServiceRoleKey.value();

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan SUPABASE_URL (functions/.env) y/o SUPABASE_SERVICE_ROLE_KEY (Secret Manager).',
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
