import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getAuth } from 'firebase/auth';

import type { Database } from '@delivery/shared';

import { getFirebaseApp } from '@/utils/firebase/client';

/**
 * Cliente Supabase en el navegador. Pide el ID token de Firebase en cada
 * petición para que RLS se aplique con el UID correcto.
 */
export function createClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      accessToken: async () => {
        const user = getAuth(getFirebaseApp()).currentUser;
        return user ? user.getIdToken() : null;
      },
    },
  );
}