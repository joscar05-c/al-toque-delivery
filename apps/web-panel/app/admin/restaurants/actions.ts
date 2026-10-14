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
