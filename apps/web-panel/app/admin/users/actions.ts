'use server';

import { revalidatePath } from 'next/cache';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

export async function updateUserRole(userId: string, newRoleId: number) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  if (![1, 2, 3, 4].includes(newRoleId)) {
    return { error: 'Rol no válido.' };
  }

  // Prevent admin from accidentally demoting themselves if they are the only admin
  if (access.user.id === userId && newRoleId !== 4) {
    return { error: 'No puedes degradar tu propia cuenta de administrador.' };
  }

  const { error } = await access.supabase
    .from('users')
    .update({
      role_id: newRoleId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[updateUserRole] Error:', error);
    return { error: error.message || 'No se pudo actualizar el rol.' };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function toggleUserActive(userId: string, currentStatus: boolean) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  if (access.user.id === userId && currentStatus) {
    return { error: 'No puedes suspender tu propia cuenta de administrador.' };
  }

  const { error } = await access.supabase
    .from('users')
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[toggleUserActive] Error:', error);
    return { error: error.message || 'No se pudo cambiar el estado del usuario.' };
  }

  revalidatePath('/admin/users');
  return { success: true };
}

export async function togglePhoneVerified(userId: string, currentStatus: boolean) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { error } = await access.supabase
    .from('users')
    .update({
      phone_verified: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    console.error('[togglePhoneVerified] Error:', error);
    return { error: error.message || 'No se pudo actualizar la verificación del teléfono.' };
  }

  revalidatePath('/admin/users');
  return { success: true };
}
