import 'server-only';

import { cookies } from 'next/headers';

import { verifyFirebaseIdToken } from './admin';

/** Cookie httpOnly con el ID token de Firebase. */
export const SESSION_COOKIE = '__session';

export interface SessionUser {
  id: string;
  email: string | null;
  phone: string | null;
}

/** ID token crudo de la cookie (se usa como accessToken para Supabase). */
export async function getIdToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Usuario de la sesión actual en el servidor.
 * Devuelve null si no hay cookie o si el token expiró / fue revocado.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getIdToken();
  if (!token) return null;

  try {
    const decoded = await verifyFirebaseIdToken(token);
    return {
      id: decoded.uid,
      email: decoded.email ?? null,
      phone: decoded.phone_number ?? null,
    };
  } catch {
    return null;
  }
}

/** Escribe la cookie de sesión (solo Server Actions / Route Handlers). */
export async function createSessionCookie(
  idToken: string,
  expiresAtMs: number,
): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    expires: new Date(expiresAtMs),
  });
}

/** Borra la cookie de sesión. */
export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}