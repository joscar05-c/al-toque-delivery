import { beforeUserCreated, beforeUserSignedIn } from 'firebase-functions/v2/identity';
import { logger } from 'firebase-functions';

import { getSupabaseServiceClient, supabaseServiceRoleKey } from './supabase';

/**
 * Región de las funciones de bloqueo (Identity).
 * Cámbiala si tu proyecto usa otra región primaria.
 */
const REGION = 'us-central1';

/** Rol por defecto para nuevos usuarios móviles (public.roles.id = 1 -> client). */
const DEFAULT_ROLE_ID = 1;

/**
 * Inserta/asegura el perfil en public.users usando service_role (bypass RLS).
 * El id de la fila es el UID de Firebase (auth.uid() en las policies).
 */
async function ensureProfile(user: {
  uid: string;
  email?: string | null;
  phoneNumber?: string | null;
  displayName?: string | null;
}): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const name =
    user.displayName ??
    (user.phoneNumber ? `Usuario ${user.phoneNumber}` : 'Usuario Nuevo');

  const { error } = await supabase.from('users').upsert(
    {
      id: user.uid,
      email: user.email ?? null,
      phone: user.phoneNumber ?? null,
      name,
      role_id: DEFAULT_ROLE_ID,
    },
    { onConflict: 'id', ignoreDuplicates: true },
  );

  if (error) {
    logger.error('[ensureProfile] Supabase upsert falló', error);
    return;
  }

  logger.info('[ensureProfile] Perfil asegurado', { uid: user.uid });
}

/**
 * Bloqueante: se ejecuta al crear el usuario (primer login por SMS).
 * - Crea el perfil en Supabase.
 * - Asigna el custom claim role = 'authenticated' (obligatorio para que
 *   Supabase Postgres use el rol authenticated y `auth.uid()` funcione).
 *
 * Requiere Identity Platform habilitado en el proyecto Firebase.
 */
export const onUserCreated = beforeUserCreated(
  { region: REGION, secrets: [supabaseServiceRoleKey] },
  async (event) => {
    const user = event.data;

    if (user) {
      try {
        await ensureProfile({
          uid: user.uid,
          email: user.email,
          phoneNumber: user.phoneNumber,
          displayName: user.displayName,
        });
      } catch (error) {
        logger.error('[onUserCreated] Error asegurando perfil', error);
      }
    }

    return { customClaims: { role: 'authenticated' } };
  },
);

/**
 * Bloqueante: en cada login garantiza el claim `role: 'authenticated'`.
 * Cubre tokens emitidos cuyos claims fueron borrados o usuarios antiguos.
 */
export const onUserSignedIn = beforeUserSignedIn(
  { region: REGION },
  async () => {
    return { customClaims: { role: 'authenticated' } };
  },
);
