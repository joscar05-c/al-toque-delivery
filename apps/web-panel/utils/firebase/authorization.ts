import 'server-only';

import { createClient } from '@/utils/supabase/server';

import { getSessionUser, type SessionUser } from './session';

export const PANEL_ROLE_IDS = {
  restaurantOwner: 3,
  admin: 4,
} as const;

export async function authorizePanelRole(roleId: number): Promise<{
  user: SessionUser;
  supabase: Awaited<ReturnType<typeof createClient>>;
} | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile, error } = await supabase
    .from('users')
    .select('role_id')
    .eq('id', user.id)
    .maybeSingle();

  if (error) {
    console.error('[authorization] No se pudo verificar el rol:', error.message);
    return null;
  }

  if (profile?.role_id !== roleId) return null;
  return { user, supabase };
}

/** Verifica rol de restaurante y que el recurso pertenezca al UID autenticado. */
export async function authorizeRestaurantOwner(restaurantId?: string): Promise<{
  user: SessionUser;
  supabase: Awaited<ReturnType<typeof createClient>>;
  restaurantId: string;
} | null> {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.restaurantOwner);
  if (!access) return null;

  let query = access.supabase
    .from('restaurants')
    .select('id')
    .eq('owner_id', access.user.id);

  if (restaurantId) query = query.eq('id', restaurantId);

  const { data: restaurant, error } = await query.maybeSingle();
  if (error) {
    console.error('[authorization] No se pudo verificar el restaurante:', error.message);
    return null;
  }

  if (!restaurant) return null;

  return { ...access, restaurantId: restaurant.id };
}
