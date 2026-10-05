'use server';

import { verifyFirebaseIdToken } from '@/utils/firebase/admin';
import { createSessionCookie } from '@/utils/firebase/session';

/**
 * Recibe el ID token de Firebase (ya confirmado en el navegador) y abre la
 * sesión httpOnly del panel. El token se valida en el servidor antes de
 * aceptarse: nunca se confía en lo que manda el cliente.
 */
export async function createSessionAction(idToken: string) {
  if (!idToken) {
    return { error: 'Token de sesión inválido.' };
  }

  try {
    const decoded = await verifyFirebaseIdToken(idToken);
    await createSessionCookie(idToken, decoded.exp * 1000);
    return { ok: true };
  } catch {
    return { error: 'No se pudo validar la sesión. Vuelve a iniciar sesión.' };
  }
}