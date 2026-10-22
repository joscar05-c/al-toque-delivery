import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@delivery/shared';

/**
 * Cliente Supabase con la clave `service_role`: bypass de RLS.
 * SOLO debe usarse en el servidor (Server Actions / Route Handlers) para
 * operaciones de confianza como firmar URLs de subida a Storage.
 *
 * No lo uses nunca en el cliente ni lo expongas. Requiere la variable de
 * entorno SUPABASE_SERVICE_ROLE_KEY en apps/web-panel/.env.local.
 */
export function createServiceClient() {
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error('Ni SUPABASE_SERVICE_ROLE_KEY ni NEXT_PUBLIC_SUPABASE_ANON_KEY están configuradas.');
  }

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    key,
    {
      auth: { autoRefreshToken: false, persistSession: false },
    },
  );
}
