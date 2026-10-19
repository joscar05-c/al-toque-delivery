'use server';

import { revalidatePath } from 'next/cache';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

export async function approveDriverApplication(applicationId: string) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  // Fetch application to get user_id
  const { data: application, error: fetchError } = await access.supabase
    .from('driver_applications')
    .select('id, user_id, status')
    .eq('id', applicationId)
    .single();

  if (fetchError || !application) {
    return { error: 'Solicitud no encontrada.' };
  }

  if (application.status === 'approved') {
    return { error: 'La solicitud ya fue aprobada previamente.' };
  }

  // Update application status
  const { error: updateAppError } = await access.supabase
    .from('driver_applications')
    .update({
      status: 'approved',
      reviewed_by: access.user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  if (updateAppError) {
    console.error('[approveDriverApplication] Error actualizando solicitud:', updateAppError);
    return { error: updateAppError.message || 'Error al aprobar solicitud.' };
  }

  // Promote user to Driver role (role_id = 2)
  const { error: updateUserError } = await access.supabase
    .from('users')
    .update({
      role_id: 2, // Driver
      updated_at: new Date().toISOString(),
    })
    .eq('id', application.user_id);

  if (updateUserError) {
    console.error('[approveDriverApplication] Error promoviendo rol de usuario:', updateUserError);
    // Notice: Application is marked approved, but role failed to update. Inform admin.
    return { error: 'Solicitud aprobada, pero hubo un error al asignar el rol de repartidor al usuario.' };
  }

  revalidatePath('/admin/drivers/applications');
  revalidatePath('/admin/drivers');
  revalidatePath('/admin/users');
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
