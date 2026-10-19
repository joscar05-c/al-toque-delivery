'use server';

import { revalidatePath } from 'next/cache';

import { authorizeRestaurantOwner } from '@/utils/firebase/authorization';
import { createServiceClient } from '@/utils/supabase/service';

export async function createMenuCategory(restaurantId: string, name: string) {
  if (!name?.trim()) {
    return { error: 'El nombre es requerido' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { error } = await access.supabase
    .from('menu_categories')
    .insert({ name: name.trim(), restaurant_id: access.restaurantId, isActive: true });

  if (error) {
    console.error('Error creating menu category:', error);
    return { error: 'Error al crear la categoría' };
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}

/**
 * Genera una URL de subida firmada (signed upload URL) para el bucket
 * `menu_images`. Usa el cliente `service_role`, así que no depende de que el
 * token de Firebase sea reconocido por las policies de RLS de Storage.
 * El cliente sube el archivo directo a esa URL firmada (sin auth en la subida).
 */
export async function createMenuImageUploadUrl(
  restaurantId: string,
  fileName: string,
): Promise<{ signedUrl: string; filePath: string; error: string | null }> {
  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { signedUrl: '', filePath: '', error: 'No autorizado para este restaurante' };

  const supabase = createServiceClient();
  const filePath = `${access.restaurantId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('menu_images')
    .createSignedUploadUrl(filePath);

  if (error) {
    console.error('Error creating signed upload url:', error);
    return { signedUrl: '', filePath: '', error: 'Error al preparar la subida de la imagen' };
  }

  return { signedUrl: data.signedUrl, filePath, error: null };
}

export async function createMenuItem(formData: FormData, imageUrl?: string | null) {
  const restaurantId = formData.get('restaurantId') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const categoryId = formData.get('categoryId') as string;

  if (!name?.trim() || isNaN(price) || !categoryId || !restaurantId) {
    return { error: 'Datos incompletos' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { data: menuCategory, error: categoryError } = await access.supabase
    .from('menu_categories')
    .select('id')
    .eq('id', categoryId)
    .eq('restaurant_id', access.restaurantId)
    .maybeSingle();
  if (categoryError || !menuCategory) {
    return { error: 'Categoría no encontrada para este restaurante' };
  }

  // La imagen ya fue subida al Storage desde el cliente; aquí solo llega la URL.
  const { error } = await access.supabase
    .from('menu_items')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      price,
      image_url: imageUrl ?? null,
      restaurant_id: access.restaurantId,
      menu_category_id: categoryId,
      is_active: true,
    });

  if (error) {
    console.error('Error creating menu item:', error);
    return { error: 'Error al crear el plato' };
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}

export async function toggleMenuItem(itemId: string, currentStatus: boolean) {
  const access = await authorizeRestaurantOwner();
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { data, error } = await access.supabase
    .from('menu_items')
    .update({ is_active: !currentStatus })
    .eq('id', itemId)
    .eq('restaurant_id', access.restaurantId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error toggling menu item:', error);
    return { error: 'Error al cambiar el estado' };
  }
  if (!data) return { error: 'Plato no encontrado o no autorizado' };

  revalidatePath('/restaurant/menu');
  return { success: true };
}

export async function deleteMenuItem(itemId: string, restaurantId?: string) {
  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { error } = await access.supabase
    .from('menu_items')
    .delete()
    .eq('id', itemId)
    .eq('restaurant_id', access.restaurantId);

  if (error) {
    console.error('Error deleting menu item:', error);
    return { error: 'Error al eliminar el plato' };
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}
