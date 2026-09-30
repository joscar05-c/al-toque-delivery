import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/lib/supabase';
import type { RoleName, UserProfile } from '@/types/database.types';

/**
 * Consulta public.users (enlazada a auth.users por id) y hace join con
 * public.roles para resolver el nombre del rol ('client' | 'driver' | ...).
 */
async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*, roles(name)')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[authStore] Error obteniendo el perfil:', error.message);
    return null;
  }

  return data as UserProfile;
}

interface AuthState {
  /** Sesión de Supabase Auth (auth.users). null = no autenticado. */
  session: Session | null;
  /** Fila de public.users con el rol embebido. */
  profile: UserProfile | null;
  /** Atajo al nombre del rol para el enrutamiento condicional. */
  role: RoleName | null;
  /** true mientras se restaura la sesión inicial desde el almacenamiento. */
  isLoading: boolean;
  /** Inicia la restauración de sesión y la suscripción a cambios de auth. Devuelve el cleanup. */
  initialize: () => () => void;
  /** Vuelve a consultar public.users (útil tras cambios de perfil o de rol). */
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Evita dobles suscripciones con Fast Refresh / re-montajes del root layout.
let initialized = false;

export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  profile: null,
  role: null,
  isLoading: true,

  initialize: () => {
    if (initialized) return () => {};
    initialized = true;

    // 1. Restaurar la sesión persistida (SecureStore/AsyncStorage).
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const profile = session ? await fetchProfile(session.user.id) : null;
      set({
        session,
        profile,
        role: profile?.roles?.name ?? null,
        isLoading: false,
      });
    });

    // 2. Reaccionar a login/logout/refresco de token.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // No usar async directamente en el callback: Supabase mantiene un lock
      // interno y podría interbloquearse. Se difiere con setTimeout.
      setTimeout(async () => {
        if (event === 'SIGNED_OUT' || !session) {
          set({ session: null, profile: null, role: null });
          return;
        }
        const profile = await fetchProfile(session.user.id);
        set({
          session,
          profile,
          role: profile?.roles?.name ?? null,
          isLoading: false,
        });
      }, 0);
    });

    return () => subscription.unsubscribe();
  },

  refreshProfile: async () => {
    const session = get().session;
    if (!session) return;

    const profile = await fetchProfile(session.user.id);
    set({ profile, role: profile?.roles?.name ?? null });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, profile: null, role: null });
  },
}));
