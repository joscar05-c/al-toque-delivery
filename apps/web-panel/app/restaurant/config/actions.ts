'use server';

import { revalidatePath } from 'next/cache';

import { authorizeRestaurantOwner } from '@/utils/firebase/authorization';
import { createServiceClient } from '@/utils/supabase/service';

export async function updateDeliveryConfig(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string;
  const baseCost = parseFloat(formData.get('baseCost') as string);
  const freeThreshold = formData.get('freeThreshold') as string;

  if (!restaurantId || isNaN(baseCost)) {
    return { error: 'Datos incompletos' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { error } = await access.supabase
    .from('restaurant_delivery_config')
    .upsert({
      restaurant_id: access.restaurantId,
      delivery_fee: baseCost,
      free_delivery_threshold: freeThreshold ? parseFloat(freeThreshold) : null,
      is_delivery_enabled: true,
      delivery_type: 'platform',
      max_delivery_distance: 10,
      estimated_delivery_time: 30,
    }, { onConflict: 'restaurant_id' });

  if (error) {
    console.error('Error updating delivery config:', error);
    return { error: 'Error al guardar la configuración' };
  }

  revalidatePath('/restaurant/config');
  return { success: true };
}

/**
 * Genera una URL de subida firmada para la portada del restaurante en el
 * bucket `restaurant_images`. El archivo se sube directo a Storage con esa URL.
 */
export async function createRestaurantImageUploadUrl(
  restaurantId: string,
  fileName: string,
): Promise<{ signedUrl: string; filePath: string; error: string | null }> {
  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { signedUrl: '', filePath: '', error: 'No autorizado para este restaurante' };

  const supabase = createServiceClient();
  const filePath = `${access.restaurantId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('restaurant_images')
    .createSignedUploadUrl(filePath);

  if (error) {
    console.error('Error creating signed upload url (restaurant image):', error);
    return { signedUrl: '', filePath: '', error: 'Error al preparar la subida de la imagen' };
  }

  return { signedUrl: data.signedUrl, filePath, error: null };
}

/**
 * Guarda la URL pública de la portada en `restaurants.image_url`.
 * Se usa service_role tras validar al owner, igual que las subidas de platos,
 * para no depender de las políticas RLS de `restaurants`.
 */
export async function updateRestaurantImage(restaurantId: string, imageUrl: string) {
  if (!imageUrl) return { error: 'Imagen no válida' };

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('restaurants')
    .update({ image_url: imageUrl, updated_at: new Date().toISOString() })
    .eq('id', access.restaurantId);

  if (error) {
    console.error('Error updating restaurant image:', error);
    return { error: 'Error al guardar la portada' };
  }

  revalidatePath('/restaurant/config');
  return { success: true };
}

export async function addDriver(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string;
  const contact = formData.get('contact') as string;

  if (!restaurantId || !contact?.trim()) {
    return { error: 'Email o teléfono requerido' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { data: user, error: userError } = await access.supabase
    .from('users')
    .select('id, email, phone')
    .or(`email.eq.${contact.trim()},phone.eq.${contact.trim()}`)
    .eq('role_id', 2)
    .single();

  if (userError || !user) {
    return { error: 'No se encontró un repartidor con ese email/teléfono' };
  }

  const { error } = await access.supabase
    .from('restaurant_drivers')
    .insert({ restaurant_id: access.restaurantId, driver_id: user.id, is_active: true });

  if (error) {
    console.error('Error adding driver:', error);
    if (error.code === '23505') {
      return { error: 'Este repartidor ya está vinculado a tu restaurante' };
    }
    return { error: 'Error al vincular el repartidor' };
  }

  revalidatePath('/restaurant/config');
  return { success: true };
}

export async function removeDriver(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string;
  const driverId = formData.get('driverId') as string;

  if (!restaurantId || !driverId) {
    return { error: 'Datos incompletos' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { error } = await access.supabase
    .from('restaurant_drivers')
    .delete()
    .eq('restaurant_id', access.restaurantId)
    .eq('driver_id', driverId);

  if (error) {
    console.error('Error removing driver:', error);
    return { error: 'Error al desvincular el repartidor' };
  }

  revalidatePath('/restaurant/config');
  return { success: true };
}
