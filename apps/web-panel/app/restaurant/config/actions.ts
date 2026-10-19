'use server';

import { revalidatePath } from 'next/cache';

import { authorizeRestaurantOwner } from '@/utils/firebase/authorization';
import { createServiceClient } from '@/utils/supabase/service';

/**
 * Actualiza los datos operativos y comerciales del restaurante (tabla `restaurants`).
 */
export async function updateRestaurantProfile(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string;
  const name = (formData.get('name') as string)?.trim();
  const phone = (formData.get('phone') as string)?.trim();
  const address = (formData.get('address') as string)?.trim();
  const city = formData.get('city') as string;
  const categoryId = formData.get('categoryId') as string;
  const averagePrepTime = parseInt(formData.get('averagePrepTime') as string, 10);
  const isActive = formData.get('isActive') === 'true';

  if (!restaurantId || !name || !phone || !address) {
    return { error: 'Nombre, teléfono y dirección son obligatorios' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('restaurants')
    .update({
      name,
      phone,
      address,
      city: city ? (city as 'bagua' | 'jaen' | 'chachapoyas' | 'other') : null,
      restaurant_category_id: categoryId || null,
      average_prep_time: isNaN(averagePrepTime) ? 15 : averagePrepTime,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq('id', access.restaurantId);

  if (error) {
    console.error('Error updating restaurant profile:', error);
    return { error: 'Error al actualizar los datos del restaurante' };
  }

  revalidatePath('/restaurant/config');
  revalidatePath('/restaurant/orders');
  return { success: true };
}

/**
 * Alterna el estado operativo (abierto/cerrado) del restaurante con un solo clic.
 */
export async function toggleRestaurantActive(restaurantId: string, currentStatus: boolean) {
  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado' };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('restaurants')
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', access.restaurantId);

  if (error) {
    console.error('Error toggling restaurant active state:', error);
    return { error: 'Error al cambiar estado del restaurante' };
  }

  revalidatePath('/restaurant/config');
  revalidatePath('/restaurant/orders');
  return { success: true, isActive: !currentStatus };
}

/**
 * Actualiza la configuración completa de delivery (tabla `restaurant_delivery_config`).
 */
export async function updateDeliveryConfig(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string;
  const isDeliveryEnabled = formData.get('isDeliveryEnabled') === 'true';
  let deliveryType = (formData.get('deliveryType') as 'platform' | 'restaurant_own' | 'pickup_only') || 'platform';

  // Si el delivery a domicilio está desactivado, se fuerza la modalidad a 'pickup_only'
  if (!isDeliveryEnabled) {
    deliveryType = 'pickup_only';
  }

  const minOrderRaw = formData.get('minOrderAmount') as string;
  const minOrderAmount = minOrderRaw && minOrderRaw.trim() !== '' ? parseFloat(minOrderRaw) : null;

  let baseCost = 0;
  let freeThreshold: number | null = null;
  let maxDistance = 10;
  let estimatedDeliveryTime = 30;

  if (deliveryType === 'restaurant_own') {
    const rawCost = formData.get('baseCost') as string;
    baseCost = parseFloat(rawCost);
    if (isNaN(baseCost) || baseCost < 0) {
      return { error: 'El costo base de delivery para Flota Propia debe ser un número válido (≥ 0)' };
    }

    const rawFree = formData.get('freeThreshold') as string;
    freeThreshold = rawFree && rawFree.trim() !== '' ? parseFloat(rawFree) : null;

    const rawDist = parseInt(formData.get('maxDistance') as string, 10);
    maxDistance = isNaN(rawDist) || rawDist < 1 ? 10 : rawDist;

    const rawTime = parseInt(formData.get('estimatedDeliveryTime') as string, 10);
    estimatedDeliveryTime = isNaN(rawTime) || rawTime < 5 ? 30 : rawTime;
  } else if (deliveryType === 'platform') {
    // En Red Al Toque, la tarifa y radio los calcula la plataforma por distancia GPS.
    baseCost = 0;
    freeThreshold = null;
    maxDistance = 15; // Radio estándar de la plataforma
    const rawTime = parseInt(formData.get('estimatedDeliveryTime') as string, 10);
    estimatedDeliveryTime = isNaN(rawTime) || rawTime < 5 ? 30 : rawTime;
  } else {
    // Solo Recojo
    baseCost = 0;
    freeThreshold = null;
    maxDistance = 0;
    const rawTime = parseInt(formData.get('estimatedDeliveryTime') as string, 10);
    estimatedDeliveryTime = isNaN(rawTime) || rawTime < 5 ? 20 : rawTime;
  }

  if (!restaurantId) {
    return { error: 'ID de restaurante no proporcionado' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const supabase = createServiceClient();
  const { error } = await supabase
    .from('restaurant_delivery_config')
    .upsert(
      {
        restaurant_id: access.restaurantId,
        delivery_fee: baseCost,
        free_delivery_threshold: freeThreshold,
        min_order_amount: minOrderAmount,
        max_delivery_distance: maxDistance,
        estimated_delivery_time: estimatedDeliveryTime,
        is_delivery_enabled: isDeliveryEnabled,
        delivery_type: deliveryType,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'restaurant_id' },
    );

  if (error) {
    console.error('Error updating delivery config:', error);
    return { error: 'Error al guardar la configuración de delivery' };
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
