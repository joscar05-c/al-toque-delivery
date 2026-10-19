'use server';

import { revalidatePath } from 'next/cache';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

export async function createCategory(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const icon = String(formData.get('icon') ?? '').trim();

  if (!name) {
    return { error: 'El nombre de la categoría es obligatorio.' };
  }

  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { error } = await access.supabase
    .from('restaurant_categories')
    .insert({
      name,
      description: description || null,
      icon: icon || null,
      isActive: true,
    });

  if (error) {
    console.error('[createCategory] Error al crear categoría:', error);
    if (error.code === '23505') {
      return { error: 'Ya existe una categoría con este nombre.' };
    }
    return { error: error.message || 'Error al crear la categoría.' };
  }

  revalidatePath('/admin/categories');
  return { success: true };
}

export async function updateCategory(id: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  const icon = String(formData.get('icon') ?? '').trim();

  if (!name) {
    return { error: 'El nombre de la categoría es obligatorio.' };
  }

  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { error } = await access.supabase
    .from('restaurant_categories')
    .update({
      name,
      description: description || null,
      icon: icon || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[updateCategory] Error al actualizar categoría:', error);
    if (error.code === '23505') {
      return { error: 'Ya existe una categoría con este nombre.' };
    }
    return { error: error.message || 'Error al actualizar la categoría.' };
  }

  revalidatePath('/admin/categories');
  return { success: true };
}

export async function toggleCategory(id: string, currentStatus: boolean) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { error } = await access.supabase
    .from('restaurant_categories')
    .update({
      isActive: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    console.error('[toggleCategory] Error al cambiar estado:', error);
    return { error: error.message || 'Error al cambiar el estado.' };
  }

  revalidatePath('/admin/categories');
  return { success: true };
}
