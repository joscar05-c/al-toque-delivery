import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase con service_role: se salta RLS.
 * Solo se usa en el backend (Cloud Functions). NUNCA exponer esta key.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseServiceClient(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan SUPABASE_URL y/o SUPABASE_SERVICE_ROLE_KEY en el entorno de Functions.',
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return cached;
}
