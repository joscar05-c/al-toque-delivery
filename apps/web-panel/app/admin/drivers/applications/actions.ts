'use server';

import { revalidatePath } from 'next/cache';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

export async function approveDriverApplication(
  applicationId: string,
  driverType: 'platform' | 'restaurant_own' = 'platform',
) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  if (driverType !== 'platform' && driverType !== 'restaurant_own') {
    return { error: 'Tipo de repartidor no válido.' };
  }

  const { error } = await access.supabase.rpc('admin_approve_driver_application', {
    p_application_id: applicationId,
    p_driver_type_code: driverType,
  });

  if (error) {
    console.error('[approveDriverApplication] Error en RPC:', error);
    return { error: error.message || 'Error al aprobar solicitud de repartidor.' };
  }

  revalidatePath('/admin/drivers/applications');
  revalidatePath('/admin/drivers');
  revalidatePath('/admin/users');
  revalidatePath('/restaurant/config');
  return { success: true };
}

export async function rejectDriverApplication(applicationId: string, reason: string) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const trimmedReason = reason?.trim();
  if (!trimmedReason) {
    return { error: 'Debes especificar un motivo de rechazo.' };
  }

  const { error } = await access.supabase
    .from('driver_applications')
    .update({
      status: 'rejected',
      rejection_reason: trimmedReason,
      reviewed_by: access.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  if (error) {
    console.error('[rejectDriverApplication] Error rechazando:', error);
    return { error: error.message || 'Error al rechazar solicitud.' };
  }

  revalidatePath('/admin/drivers/applications');
  return { success: true };
}
