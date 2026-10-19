'use server';

import { revalidatePath } from 'next/cache';

import { authorizeRestaurantOwner } from '@/utils/firebase/authorization';
import { createServiceClient } from '@/utils/supabase/service';

export interface OptionInput {
  id?: string;
  name: string;
  extraPrice: number;
}

export async function createMenuCategory(
  restaurantId: string,
  name: string,
  description?: string,
) {
  if (!name?.trim()) {
    return { error: 'El nombre es requerido' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { data: maxCat } = await access.supabase
    .from('menu_categories')
    .select('sortOrder')
    .eq('restaurant_id', access.restaurantId)
    .order('sortOrder', { ascending: false })
    .limit(1);

  const nextOrder = (maxCat?.[0]?.sortOrder ?? 0) + 1;

  const { error } = await access.supabase.from('menu_categories').insert({
    name: name.trim(),
    description: description?.trim() || null,
    restaurant_id: access.restaurantId,
    isActive: true,
    sortOrder: nextOrder,
  });

  if (error) {
    console.error('Error creating menu category:', error);
    return { error: 'Error al crear la categoría' };
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}

export async function updateMenuCategory(
  restaurantId: string,
  categoryId: string,
  name: string,
  description?: string,
) {
  if (!name?.trim()) {
    return { error: 'El nombre de la categoría es requerido' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { error } = await access.supabase
    .from('menu_categories')
    .update({
      name: name.trim(),
      description: description?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', categoryId)
    .eq('restaurant_id', access.restaurantId);

  if (error) {
    console.error('Error updating menu category:', error);
    return { error: 'Error al actualizar la categoría' };
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}

export async function deleteMenuCategory(
  restaurantId: string,
  categoryId: string,
) {
  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  // Comprobar si existen platos asignados a esta categoría
  const { count, error: countError } = await access.supabase
    .from('menu_items')
    .select('id', { count: 'exact', head: true })
    .eq('menu_category_id', categoryId)
    .eq('restaurant_id', access.restaurantId);

  if (countError) {
    console.error('Error checking items for category:', countError);
    return { error: 'Error al comprobar platos en la categoría' };
  }

  if (count && count > 0) {
    return {
      error: `No puedes eliminar esta categoría porque contiene ${count} plato(s). Reasigna o elimina los platos antes de continuar.`,
    };
  }

  const { error } = await access.supabase
    .from('menu_categories')
    .delete()
    .eq('id', categoryId)
    .eq('restaurant_id', access.restaurantId);

  if (error) {
    console.error('Error deleting menu category:', error);
    return { error: 'Error al eliminar la categoría' };
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}

/**
 * Genera una URL de subida firmada (signed upload URL) para el bucket
 * `menu_images`.
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

  const { data: newItem, error } = await access.supabase
    .from('menu_items')
    .insert({
      name: name.trim(),
      description: description?.trim() || null,
      price,
      image_url: imageUrl ?? null,
      restaurant_id: access.restaurantId,
      menu_category_id: categoryId,
      is_active: true,
    })
    .select('id')
    .single();

  if (error || !newItem) {
    console.error('Error creating menu item:', error);
    return { error: 'Error al crear el plato' };
  }

  // Vincular grupos de opciones si se seleccionaron
  const rawOptionGroups = formData.get('optionGroupIds') as string;
  let optionGroupIds: string[] = [];
  if (rawOptionGroups) {
    try {
      optionGroupIds = JSON.parse(rawOptionGroups);
    } catch {
      optionGroupIds = (formData.getAll('optionGroupIds') as string[]).filter(Boolean);
    }
  }

  if (optionGroupIds.length > 0) {
    const links = optionGroupIds.map((groupId) => ({
      menu_item_id: newItem.id,
      group_id: groupId,
    }));
    await access.supabase.from('menu_item_option_groups').insert(links);
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}

export async function updateMenuItem(
  formData: FormData,
  newImageUrl?: string | null,
) {
  const itemId = formData.get('itemId') as string;
  const restaurantId = formData.get('restaurantId') as string;
  const name = formData.get('name') as string;
  const description = formData.get('description') as string;
  const price = parseFloat(formData.get('price') as string);
  const categoryId = formData.get('categoryId') as string;

  if (!itemId || !name?.trim() || isNaN(price) || !categoryId || !restaurantId) {
    return { error: 'Datos incompletos para actualizar el plato' };
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
    return { error: 'Categoría no válida para este restaurante' };
  }

  const updateData: {
    name: string;
    description: string | null;
    price: number;
    menu_category_id: string;
    image_url?: string | null;
  } = {
    name: name.trim(),
    description: description?.trim() || null,
    price,
    menu_category_id: categoryId,
  };

  if (newImageUrl !== undefined) {
    updateData.image_url = newImageUrl;
  }

  const { error } = await access.supabase
    .from('menu_items')
    .update(updateData)
    .eq('id', itemId)
    .eq('restaurant_id', access.restaurantId);

  if (error) {
    console.error('Error updating menu item:', error);
    return { error: 'Error al actualizar el plato' };
  }

  // Sincronizar grupos de opciones asociados
  const rawOptionGroups = formData.get('optionGroupIds') as string;
  if (rawOptionGroups !== null && rawOptionGroups !== undefined) {
    let optionGroupIds: string[] = [];
    try {
      optionGroupIds = JSON.parse(rawOptionGroups);
    } catch {
      optionGroupIds = (formData.getAll('optionGroupIds') as string[]).filter(Boolean);
    }

    await access.supabase
      .from('menu_item_option_groups')
      .delete()
      .eq('menu_item_id', itemId);

    if (optionGroupIds.length > 0) {
      const links = optionGroupIds.map((groupId) => ({
        menu_item_id: itemId,
        group_id: groupId,
      }));
      await access.supabase.from('menu_item_option_groups').insert(links);
    }
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}

export async function toggleMenuItem(
  itemId: string,
  currentStatus: boolean,
  restaurantId?: string,
) {
  const access = await authorizeRestaurantOwner(restaurantId);
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

  // Eliminar referencias en grupos de opciones
  await access.supabase
    .from('menu_item_option_groups')
    .delete()
    .eq('menu_item_id', itemId);

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

/* =========================================================================
 * GRUPOS DE OPCIONES Y ADICIONALES (PUNTO E)
 * ========================================================================= */

export async function createOptionGroup(
  restaurantId: string,
  data: {
    name: string;
    description?: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    options: OptionInput[];
  },
) {
  if (!data.name?.trim()) {
    return { error: 'El nombre del grupo de opciones es obligatorio' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { data: group, error: groupError } = await access.supabase
    .from('menu_option_groups')
    .insert({
      restaurant_id: access.restaurantId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      minSelect: Number(data.minSelect) || 0,
      maxSelect: Number(data.maxSelect) || 1,
      isRequired: Boolean(data.isRequired),
    })
    .select('id')
    .single();

  if (groupError || !group) {
    console.error('Error creating option group:', groupError);
    return { error: 'Error al crear el grupo de opciones' };
  }

  if (data.options && data.options.length > 0) {
    const validOptions = data.options
      .filter((opt) => opt.name?.trim())
      .map((opt) => ({
        group_id: group.id,
        name: opt.name.trim(),
        extraPrice: Number(opt.extraPrice) || 0,
        isActive: true,
      }));

    if (validOptions.length > 0) {
      const { error: optError } = await access.supabase
        .from('menu_options')
        .insert(validOptions);

      if (optError) {
        console.error('Error inserting menu options:', optError);
      }
    }
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}

export async function updateOptionGroup(
  restaurantId: string,
  groupId: string,
  data: {
    name: string;
    description?: string;
    minSelect: number;
    maxSelect: number;
    isRequired: boolean;
    options: OptionInput[];
  },
) {
  if (!data.name?.trim()) {
    return { error: 'El nombre del grupo de opciones es obligatorio' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { error: groupError } = await access.supabase
    .from('menu_option_groups')
    .update({
      name: data.name.trim(),
      description: data.description?.trim() || null,
      minSelect: Number(data.minSelect) || 0,
      maxSelect: Number(data.maxSelect) || 1,
      isRequired: Boolean(data.isRequired),
      updated_at: new Date().toISOString(),
    })
    .eq('id', groupId)
    .eq('restaurant_id', access.restaurantId);

  if (groupError) {
    console.error('Error updating option group:', groupError);
    return { error: 'Error al actualizar el grupo de opciones' };
  }

  // Eliminar opciones anteriores del grupo y re-insertar
  await access.supabase.from('menu_options').delete().eq('group_id', groupId);

  if (data.options && data.options.length > 0) {
    const validOptions = data.options
      .filter((opt) => opt.name?.trim())
      .map((opt) => ({
        group_id: groupId,
        name: opt.name.trim(),
        extraPrice: Number(opt.extraPrice) || 0,
        isActive: true,
      }));

    if (validOptions.length > 0) {
      await access.supabase.from('menu_options').insert(validOptions);
    }
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}

export async function deleteOptionGroup(restaurantId: string, groupId: string) {
  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  // Eliminar referencias en platos
  await access.supabase
    .from('menu_item_option_groups')
    .delete()
    .eq('group_id', groupId);

  // Eliminar opciones
  await access.supabase
    .from('menu_options')
    .delete()
    .eq('group_id', groupId);

  // Eliminar grupo
  const { error } = await access.supabase
    .from('menu_option_groups')
    .delete()
    .eq('id', groupId)
    .eq('restaurant_id', access.restaurantId);

  if (error) {
    console.error('Error deleting option group:', error);
    return { error: 'Error al eliminar el grupo de opciones' };
  }

  revalidatePath('/restaurant/menu');
  return { success: true };
}
