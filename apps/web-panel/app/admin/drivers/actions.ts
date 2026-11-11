'use server';

import { revalidatePath } from 'next/cache';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

export async function toggleDriverActive(driverId: string, currentStatus: boolean) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { error } = await access.supabase
    .from('users')
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', driverId);

  if (error) {
    console.error('[toggleDriverActive] Error:', error);
    return { error: error.message || 'Error al cambiar estado del repartidor.' };
  }

  revalidatePath('/admin/drivers');
  return { success: true };
}

export async function updateDriverType(
  driverId: string,
  driverType: 'platform' | 'restaurant_own',
) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  if (driverType !== 'platform' && driverType !== 'restaurant_own') {
    return { error: 'Tipo de repartidor no válido.' };
  }

  const now = new Date().toISOString();
  const { error } = await access.supabase
    .from('driver_profiles')
    .upsert(
      {
        user_id: driverId,
        driver_type_code: driverType,
        approved_by: access.user.id,
        approved_at: now,
        updated_at: now,
      },
      { onConflict: 'user_id' },
    );

  if (error) {
    console.error('[updateDriverType] Error:', error);
    return { error: error.message || 'No se pudo cambiar la modalidad del repartidor.' };
  }

  revalidatePath('/admin/drivers');
  revalidatePath('/restaurant/config');
  revalidatePath('/restaurant/orders');
  return { success: true };
}
