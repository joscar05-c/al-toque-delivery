import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE } from '@/utils/firebase/constants';

/**
 * Guarda de rutas del panel. La sesión vive en la cookie httpOnly `__session`
 * (ID token de Firebase). El middleware solo comprueba su presencia: la
 * verificación criptográfica la hace `getSessionUser()` en el servidor.
 */
export async function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;

  // Si llega a /login por cierre de sesión o acceso denegado, limpiar la cookie de sesión
  if (
    pathname === '/login' &&
    (searchParams.has('logout') || searchParams.has('error'))
  ) {
    const response = NextResponse.next();
    response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  // Si el usuario está autenticado y visita /login, redirigir al dashboard
  if (pathname === '/login' && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard-redirect';
    return NextResponse.redirect(url);
  }

  // Rutas protegidas que requieren autenticación
  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/restaurant') ||
    pathname.startsWith('/dashboard-redirect');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // Si no hay sesión, redirigir a login
  if (!hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/admin/:path*',
    '/restaurant/:path*',
    '/dashboard-redirect',
  ],
};
