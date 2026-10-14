'use client';

import { useState } from 'react';

import { signOut } from '@/app/auth/actions';
import { signOutClient } from '@/utils/firebase/auth-client';

interface SignOutButtonProps {
  className: string;
}

export function SignOutButton({ className }: SignOutButtonProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);

  async function handleSignOut() {
    if (isSigningOut) return;
    setIsSigningOut(true);

    try {
      await signOutClient();
    } catch (error) {
      // Aun si Firebase falla, borra la cookie httpOnly del servidor.
      console.error('[SignOutButton] Firebase sign-out falló:', error);
    }

    await signOut();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={`${className} disabled:cursor-wait disabled:opacity-60`}
    >
      {isSigningOut ? 'Cerrando sesión...' : 'Cerrar Sesión'}
    </button>
  );
}
