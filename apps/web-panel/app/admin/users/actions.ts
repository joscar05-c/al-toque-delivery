'use server';

import { revalidatePath } from 'next/cache';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

export async function updateUserRole(
  userId: string,
  newRoleId: number,
  driverType: 'platform' | 'restaurant_own' = 'platform',
) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  if (![1, 2, 3, 4].includes(newRoleId)) {
    return { error: 'Rol no válido.' };
  }

  if (newRoleId === 2 && driverType !== 'platform' && driverType !== 'restaurant_own') {
    return { error: 'Modalidad de repartidor no válida.' };
  }

  // Prevent admin from accidentally demoting themselves if they are the only admin
  if (access.user.id === userId && newRoleId !== 4) {
    return { error: 'No puedes degradar tu propia cuenta de administrador.' };
  }

  const now = new Date().toISOString();
  const { error } = await access.supabase
    .from('users')
    .update({
      role_id: newRoleId,
      updated_at: now,
    })
    .eq('id', userId);

  if (error) {
    console.error('[updateUserRole] Error:', error);
    return { error: error.message || 'No se pudo actualizar el rol.' };
  }

  if (newRoleId === 2) {
    const { error: profileError } = await access.supabase
      .from('driver_profiles')
      .upsert(
        {
          user_id: userId,
          driver_type_code: driverType,
          approved_by: access.user.id,
          approved_at: now,
          updated_at: now,
        },
        { onConflict: 'user_id' },
      );

    if (profileError) {
      console.error('[updateUserRole] Error guardando driver_profiles:', profileError);
      return { error: profileError.message || 'Rol actualizado, pero falló la configuración de modalidad del repartidor.' };
    }
  } else {
    // Si deja de ser repartidor, desactivar posibles vínculos previos en restaurant_drivers
    await access.supabase
      .from('restaurant_drivers')
      .update({ is_active: false, updated_at: now })
      .eq('driver_id', userId)
      .eq('is_active', true);
  }

  revalidatePath('/admin/users');
  revalidatePath('/admin/drivers');
  revalidatePath('/restaurant/config');
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
