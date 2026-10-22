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
