'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateDeliveryConfig(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string;
  const baseCost = parseFloat(formData.get('baseCost') as string);
  const freeThreshold = formData.get('freeThreshold') as string;

  if (!restaurantId || isNaN(baseCost)) {
    return { error: 'Datos incompletos' };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from('restaurant_delivery_config')
    .upsert({
      restaurant_id: restaurantId,
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

export async function addDriver(formData: FormData) {
  const restaurantId = formData.get('restaurantId') as string;
  const contact = formData.get('contact') as string;

  if (!restaurantId || !contact?.trim()) {
    return { error: 'Email o teléfono requerido' };
  }

  const supabase = await createClient();

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, phone')
    .or(`email.eq.${contact.trim()},phone.eq.${contact.trim()}`)
    .eq('role_id', 2)
    .single();

  if (userError || !user) {
    return { error: 'No se encontró un repartidor con ese email/teléfono' };
  }

  const { error } = await supabase
    .from('restaurant_drivers')
    .insert({ restaurant_id: restaurantId, driver_id: user.id, is_active: true });

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

  const supabase = await createClient();

  const { error } = await supabase
    .from('restaurant_drivers')
    .delete()
    .eq('restaurant_id', restaurantId)
    .eq('driver_id', driverId);

  if (error) {
    console.error('Error removing driver:', error);
    return { error: 'Error al desvincular el repartidor' };
  }

  revalidatePath('/restaurant/config');
  return { success: true };
}