'use server';

import { verifyFirebaseIdToken } from '@/utils/firebase/admin';
import { createSessionCookie } from '@/utils/firebase/session';
import { createServiceClient } from '@/utils/supabase/service';

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
    const supabase = createServiceClient();
    const { data: profile } = await supabase
      .from('users')
      .select('role_id, is_active')
      .eq('id', decoded.uid)
      .maybeSingle();

    if (!profile || !profile.is_active) {
      return {
        error: 'No se encontró una cuenta activa asociada a este número.',
      };
    }

    if (profile.role_id !== 3 && profile.role_id !== 4) {
      return {
        error:
          'Acceso denegado: esta cuenta no tiene permisos de Restaurante ni Super Admin.',
      };
    }

    await createSessionCookie(idToken, decoded.exp * 1000);
    return { ok: true };
  } catch {
    return { error: 'No se pudo validar la sesión. Vuelve a iniciar sesión.' };
  }
}