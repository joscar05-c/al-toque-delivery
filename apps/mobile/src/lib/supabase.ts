import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { getIdToken } from '@/lib/firebase';
import type { Database } from '@delivery/shared';

/**
 * Cliente Supabase apuntando a Postgres con Third-Party Auth (Firebase).
 *
 * Ya NO se usa Supabase Auth: el JWT lo emite Firebase (ID token) y Supabase
 * lo verifica porque el proyecto tiene integrada la Third-Party Auth de Firebase.
 * `auth.uid()` en las RLS devuelve el `sub` del JWT = Firebase UID.
 *
 * `accessToken` se invoca en cada request; así el token siempre está fresco.
 */

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Faltan EXPO_PUBLIC_SUPABASE_URL y/o EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Crea un archivo .env en la raíz del proyecto (ver .env.example).',
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  accessToken: async () => (await getIdToken()) ?? null,
});

/**
 * Realtime necesita el token explícito para respetar RLS.
 * Llamar tras cada login/refresh de Firebase.
 */
export async function syncRealtimeAuth(): Promise<void> {
  const token = await getIdToken();
  await supabase.realtime.setAuth(token ?? null);
}
