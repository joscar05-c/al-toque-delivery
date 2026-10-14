'use server';

import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';
import { revalidatePath } from 'next/cache';

export async function approveRestaurant(applicationId: string) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { data: restaurantId, error } = await access.supabase.rpc(
    'admin_approve_restaurant_application',
    { p_application_id: applicationId },
  );

  if (error) {
    console.error('[approveRestaurant] Error en transacción:', error);
    return { error: error.message || 'No se pudo aprobar la solicitud' };
  }

  revalidatePath('/admin/applications');
  revalidatePath('/admin/restaurants');
  return { success: true, restaurantId };
}
