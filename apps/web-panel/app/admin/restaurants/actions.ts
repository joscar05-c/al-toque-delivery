'use server';

import { revalidatePath } from 'next/cache';

import {
  authorizePanelRole,
  PANEL_ROLE_IDS,
} from '@/utils/firebase/authorization';

const RESTAURANT_CITIES = new Set([
  'bagua',
  'jaen',
  'chachapoyas',
  'other',
]);

export async function createRestaurant(formData: FormData) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const ownerId = String(formData.get('ownerId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const categoryId = String(formData.get('categoryId') ?? '').trim();
  const averagePrepTime = Number(formData.get('averagePrepTime'));

  if (!ownerId || !name || !address || !phone || !city) {
    return { error: 'Completa propietario, nombre, dirección, teléfono y ciudad.' };
  }

  if (!RESTAURANT_CITIES.has(city)) {
    return { error: 'Selecciona una ciudad válida.' };
  }

  if (!Number.isInteger(averagePrepTime) || averagePrepTime < 1) {
    return { error: 'El tiempo de preparación debe ser un entero mayor a cero.' };
  }

  const { data: restaurantId, error } = await access.supabase.rpc(
    'admin_create_restaurant',
    {
      p_owner_id: ownerId,
      p_name: name,
      p_address: address,
      p_phone: phone,
      p_city: city,
      p_category_id: categoryId || null,
      p_average_prep_time: averagePrepTime,
    },
  );

  if (error) {
    console.error('[createRestaurant] Error en transacción:', error);
    return { error: error.message || 'No se pudo crear el restaurante.' };
  }

  revalidatePath('/admin/restaurants');
  revalidatePath('/admin');
  revalidatePath('/dashboard-redirect');
  return { success: true, restaurantId };
}

export async function toggleRestaurantActive(restaurantId: string, currentStatus: boolean) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { error } = await access.supabase
    .from('restaurants')
    .update({
      is_active: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', restaurantId);

  if (error) {
    console.error('[toggleRestaurantActive] Error:', error);
    return { error: error.message || 'No se pudo cambiar el estado del restaurante.' };
  }

  revalidatePath('/admin/restaurants');
  revalidatePath('/admin');
  return { success: true };
}

export async function toggleRestaurantPartner(restaurantId: string, currentStatus: boolean) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { error } = await access.supabase
    .from('restaurants')
    .update({
      is_partner: !currentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', restaurantId);

  if (error) {
    console.error('[toggleRestaurantPartner] Error:', error);
    return { error: error.message || 'No se pudo cambiar el estado de socio.' };
  }

  revalidatePath('/admin/restaurants');
  return { success: true };
}

export async function updateRestaurant(restaurantId: string, formData: FormData) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const name = String(formData.get('name') ?? '').trim();
  const address = String(formData.get('address') ?? '').trim();
  const phone = String(formData.get('phone') ?? '').trim();
  const city = String(formData.get('city') ?? '').trim();
  const categoryId = String(formData.get('categoryId') ?? '').trim();
  const imageUrl = String(formData.get('imageUrl') ?? '').trim();
  const averagePrepTime = Number(formData.get('averagePrepTime'));

  if (!name || !address || !phone || !city) {
    return { error: 'Nombre, dirección, teléfono y ciudad son obligatorios.' };
  }

  if (!RESTAURANT_CITIES.has(city)) {
    return { error: 'Selecciona una ciudad válida.' };
  }

  if (!Number.isInteger(averagePrepTime) || averagePrepTime < 1) {
    return { error: 'El tiempo promedio de preparación debe ser un entero positivo.' };
  }

  const { error } = await access.supabase
    .from('restaurants')
    .update({
      name,
      address,
      phone,
      city: city as any,
      restaurant_category_id: categoryId || null,
      average_prep_time: averagePrepTime,
      image_url: imageUrl || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', restaurantId);

  if (error) {
    console.error('[updateRestaurant] Error al actualizar:', error);
    return { error: error.message || 'No se pudo actualizar el restaurante.' };
  }

  revalidatePath('/admin/restaurants');
  revalidatePath('/admin');
  return { success: true };
}
