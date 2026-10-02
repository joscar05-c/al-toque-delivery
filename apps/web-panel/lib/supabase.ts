import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from '@delivery/shared';

/**
 * Cliente Supabase para Server Components / Server Actions (App Router).
 * La sesión viaja en cookies: `getAll` lee, `setAll` escribe.
 *
 * Next 16: `cookies()` es async. Además solo permite escribir cookies en
 * Server Actions y Route Handlers; en Server Components lanza error, por eso
 * el refresco de sesión se delega al middleware.
 */
export async function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
        'Completa apps/web-panel/.env.local (ver .env.example).',
    );
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components no pueden escribir cookies.
        }
      },
    },
  });
}