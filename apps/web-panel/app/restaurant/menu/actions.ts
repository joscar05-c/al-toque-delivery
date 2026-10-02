'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createMenuCategory(restaurantId: string, name: string) {
  if (!name?.trim()) {
    return { error: 'El nombre es requerido' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('menu_categories')
    .insert({ name: name.trim(), restaurant_id: restaurantId, isActive: true });

  if (error) {
    console.error('Error creating menu category:', error);
    return { error: 'Error al crear la categoría' };
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}

export async function createMenuItem(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const categoryId = formData.get('categoryId') as string;
  const imageFile = formData.get('image') as File | null;

  if (!name?.trim() || isNaN(price) || !categoryId || !restaurantId) {
    return { error: 'Datos incompletos' };
  }

  const supabase = await createClient();

  let imageUrl: string | null = null;

  if (imageFile && imageFile.size > 0) {
    const fileExt = imageFile.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `${restaurantId}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('menu_images')
      .upload(filePath, imageFile, { cacheControl: '3600', upsert: false });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return { error: 'Error al subir la imagen' };
    }

    const { data: urlData } = supabase.storage.from('menu_images').getPublicUrl(filePath);
    imageUrl = urlData.publicUrl;
  }

  const { error } = await supabase
    .from('menu_items')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      price,
      image_url: imageUrl,
      restaurant_id: restaurantId,
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
  const supabase = await createClient();

  const { error } = await supabase
    .from('menu_items')
    .update({ is_active: !currentStatus })
    .eq('id', itemId);

  if (error) {
    console.error('Error toggling menu item:', error);
    return { error: 'Error al cambiar el estado' };
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}