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

/** 
 * Verifica que el usuario tenga rol de restaurante (y sea su dueño)
 * o que sea Super Admin (con acceso completo de gestión a cualquier restaurante).
 */
export async function authorizeRestaurantOwner(restaurantId?: string): Promise<{
  user: SessionUser;
  supabase: Awaited<ReturnType<typeof createClient>>;
  restaurantId: string;
} | null> {
  const user = await getSessionUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role_id')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError || !profile) {
    console.error('[authorization] No se pudo verificar el rol:', profileError?.message);
    return null;
  }

  // 1. Super Admin (role_id === 4): permiso total sobre cualquier restaurante
  if (profile.role_id === PANEL_ROLE_IDS.admin) {
    if (restaurantId) {
      const { data: rest, error: restError } = await supabase
        .from('restaurants')
        .select('id')
        .eq('id', restaurantId)
        .maybeSingle();

      if (restError || !rest) {
        console.error('[authorization] Restaurante no encontrado:', restError?.message);
        return null;
      }
      return { user, supabase, restaurantId: rest.id };
    }

    // Si no se proporcionó ID, seleccionar el primer restaurante del sistema
    const { data: restaurants, error: listError } = await supabase
      .from('restaurants')
      .select('id')
      .order('name')
      .limit(1);

    const firstRest = restaurants?.[0];
    if (listError || !firstRest) return null;
    return { user, supabase, restaurantId: firstRest.id };
  }

  // 2. Dueño de restaurante (role_id === 3): acceso restringido a sus propios locales
  if (profile.role_id === PANEL_ROLE_IDS.restaurantOwner) {
    let query = supabase
      .from('restaurants')
      .select('id')
      .eq('owner_id', user.id);

    if (restaurantId) {
      query = query.eq('id', restaurantId);
    }

    const { data: restaurants, error } = await query.limit(1);
    if (error) {
      console.error('[authorization] No se pudo verificar el restaurante:', error.message);
      return null;
    }

    const restaurant = restaurants?.[0];
    if (!restaurant) return null;

    return { user, supabase, restaurantId: restaurant.id };
  }

  return null;
}
