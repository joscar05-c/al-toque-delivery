import { create } from 'zustand';

import {
  onAuthStateChanged,
  signOutUser,
  type FirebaseUser,
} from '@/lib/firebase';
import { supabase, syncRealtimeAuth } from '@/lib/supabase';
import type { RoleName, UserProfile } from '@delivery/shared';

/**
 * Auth basada en Firebase (corte total de Supabase Auth).
 *
 * El perfil y el rol siguen viviendo en public.users / public.roles.
 * La fila de public.users la crea la Cloud Function `onUserCreated`
 * (Firebase Functions) al registrar el usuario; aquí solo se lee, con
 * reintentos porque la Function puede tardar unos ms tras el primer login.
 */
async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*, roles(name)')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[authStore] Error obteniendo el perfil:', error.message, error.code);
    return null;
  }

  return data as UserProfile;
}

async function fetchProfileWithRetry(
  userId: string,
  attempts = 6,
  delayMs = 700,
): Promise<UserProfile | null> {
  for (let i = 0; i < attempts; i += 1) {
    const profile = await fetchProfile(userId);
    if (profile) return profile;
    if (i < attempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return null;
}

/** Determina si el perfil del usuario aún no ha sido completado con su nombre real. */
export function isProfileIncomplete(profile: UserProfile | null): boolean {
  if (!profile) return true;
  const name = profile.name?.trim();
  if (!name) return true;
  if (name.startsWith('Usuario +')) return true;
  if (name === 'Usuario Nuevo') return true;
  if (name.toLowerCase() === 'usuario') return true;
  return false;
}

/** Forma mínima compatible con el antiguo `session.user.id` de Supabase. */
interface CompatSession {
  user: { id: string };
}

interface AuthState {
  /** Usuario Firebase (auth). null = no autenticado. */
  user: FirebaseUser | null;
  /** Atajo al UID de Firebase. */
  userId: string | null;
  /** @deprecated Compat temporal para pantallas que usan `session.user.id`. */
  session: CompatSession | null;
  /** Fila de public.users con el rol embebido. */
  profile: UserProfile | null;
  /** Atajo al nombre del rol para el enrutamiento condicional. */
  role: RoleName | null;
  /** true mientras se restaura la sesión inicial de Firebase. */
  isLoading: boolean;
  /** Inicia la restauración de sesión y la suscripción a cambios. Devuelve el cleanup. */
  initialize: () => () => void;
  /** Vuelve a consultar public.users (tras cambios de perfil o de rol). */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Evita dobles suscripciones con Fast Refresh / re-montajes del root layout.
let initialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userId: null,
  session: null,
  profile: null,
  role: null,
  isLoading: true,

  initialize: () => {
    if (initialized) return () => {};
    initialized = true;

    const unsubscribe = onAuthStateChanged((user) => {
      // Diferido: el callback no debe ser async (loops de estado de Firebase).
      setTimeout(async () => {
        if (!user) {
          set({
            user: null,
            userId: null,
            session: null,
            profile: null,
            role: null,
            isLoading: false,
          });
          return;
        }

        // Propaga el token de Firebase a Realtime para respetar RLS.
        void syncRealtimeAuth().catch((error: unknown) => {
          console.warn('[authStore] syncRealtimeAuth falló:', error);
        });

        let profile = await fetchProfileWithRetry(user.uid);
        if (!profile) {
          const fallbackName =
            user.displayName ||
            (user.phoneNumber ? `Usuario ${user.phoneNumber}` : 'Usuario Nuevo');
          try {
            await supabase.from('users').upsert({
              id: user.uid,
              phone: user.phoneNumber ?? null,
              name: fallbackName,
              role_id: 1, // client por defecto
              is_active: true,
              phone_verified: true,
            });
            profile = await fetchProfile(user.uid);
          } catch (e) {
            console.warn('[authStore] Fallback upsert de perfil falló:', e);
          }
        }

        set({
          user,
          userId: user.uid,
          session: { user: { id: user.uid } },
          profile,
          role: profile?.roles?.name ?? 'client',
          isLoading: false,
        });
      }, 0);
    });

    return unsubscribe;
  },

  refreshProfile: async () => {
    const userId = get().userId;
    if (!userId) return;

    const profile = await fetchProfile(userId);
    set({ profile, role: profile?.roles?.name ?? null });
  },

  signOut: async () => {
    await signOutUser();
    set({
      user: null,
      userId: null,
      session: null,
      profile: null,
      role: null,
    });
  },
}));
