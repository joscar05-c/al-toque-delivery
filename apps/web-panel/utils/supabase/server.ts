import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

import type { Database } from '@delivery/shared';

import { SESSION_COOKIE } from '@/utils/firebase/session';

/**
 * Cliente Supabase para Server Components / Server Actions.
 * La auth viene del ID token de Firebase guardado en la cookie `__session`:
 * Supabase lo acepta como Third-Party Auth y lo mapea al rol `authenticated`,
 * de modo que `auth.uid()` === Firebase UID en las policies de RLS.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const idToken = cookieStore.get(SESSION_COOKIE)?.value ?? null;

  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => idToken,
    },
  );
}