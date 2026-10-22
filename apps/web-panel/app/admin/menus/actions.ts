'use server';

import { revalidatePath } from 'next/cache';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

export async function toggleMenuItemActive(itemId: string, currentStatus: boolean) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { error } = await access.supabase
    .from('menu_items')
    .update({
      is_active: !currentStatus,
    })
    .eq('id', itemId);

  if (error) {
    console.error('[toggleMenuItemActive] Error:', error);
    return { error: error.message || 'Error al cambiar estado del producto.' };
  }

  revalidatePath('/admin/menus');
  return { success: true };
}

export async function updateMenuItemPrice(itemId: string, newPrice: number) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  if (newPrice < 0) {
    return { error: 'El precio no puede ser negativo.' };
  }

  const { error } = await access.supabase
    .from('menu_items')
    .update({
      price: newPrice,
    })
    .eq('id', itemId);

  if (error) {
    console.error('[updateMenuItemPrice] Error:', error);
    return { error: error.message || 'Error al actualizar precio.' };
  }

  revalidatePath('/admin/menus');
  return { success: true };
}
