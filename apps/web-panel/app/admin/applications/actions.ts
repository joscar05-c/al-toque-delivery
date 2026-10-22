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

export async function rejectRestaurant(applicationId: string, rejectionReason: string) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const reason = rejectionReason?.trim();
  if (!reason) {
    return { error: 'Debes indicar el motivo del rechazo para informar al solicitante.' };
  }

  const { error } = await access.supabase
    .from('restaurant_applications')
    .update({
      status: 'rejected',
      admin_notes: reason,
      reviewed_by: access.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  if (error) {
    console.error('[rejectRestaurant] Error al rechazar solicitud:', error);
    return { error: error.message || 'No se pudo rechazar la solicitud.' };
  }

  revalidatePath('/admin/applications');
  return { success: true };
}
