'use server';

import { revalidatePath } from 'next/cache';

import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

export async function createCategory(formData: FormData) {
  const name = formData.get('name') as string;

  if (!name?.trim()) {
    return { error: 'El nombre es requerido' };
  }

  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };
  const { supabase } = access;

  const { error } = await supabase
    .from('restaurant_categories')
    .insert({ name: name.trim(), isActive: true });

  if (error) {
    console.error('Error creating category:', error);
    return { error: 'Error al crear la categoría' };
  }

  revalidatePath('/admin/categories');
  return { success: true };
}

export async function toggleCategory(id: string, currentStatus: boolean) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };
  const { supabase } = access;

  const { error } = await supabase
    .from('restaurant_categories')
    .update({ isActive: !currentStatus })
    .eq('id', id);

  if (error) {
    console.error('Error toggling category:', error);
    return { error: 'Error al cambiar el estado' };
  }

  revalidatePath('/admin/categories');
  return { success: true };
}
