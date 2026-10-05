import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { SESSION_COOKIE } from '@/utils/firebase/session';

/**
 * Guarda de rutas del panel. La sesión vive en la cookie httpOnly `__session`
 * (ID token de Firebase). El middleware solo comprueba su presencia: la
 * verificación criptográfica la hace `getSessionUser()` en el servidor.
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/restaurant') ||
    pathname.startsWith('/dashboard-redirect');

  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  if (!request.cookies.get(SESSION_COOKIE)?.value) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/restaurant/:path*',
    '/dashboard-redirect',
  ],
};