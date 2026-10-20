import { updateUserProfile } from '@/lib/firebase';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type {
  Database,
  DriverApplication,
  RestaurantApplication,
  RestaurantCategory,
} from '@delivery/shared';

export type VehicleType = Database['public']['Enums']['driver_applications_vehicle_type_enum'];
export type ApplicationCity = Database['public']['Enums']['restaurant_applications_city_enum'];

/** Actualiza nombre y correo del usuario en Supabase y Firebase Auth. */
export async function updateUserProfileData(
  userId: string,
  data: { name: string; email?: string | null },
): Promise<void> {
  const trimmedName = data.name.trim();
  const trimmedEmail = data.email?.trim() || null;

  if (!trimmedName || trimmedName.length < 3) {
    throw new Error('El nombre debe tener al menos 3 caracteres.');
  }

  if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    throw new Error('Ingresa un correo electrónico válido o déjalo en blanco.');
  }

  // 1. Actualizar en Supabase public.users
  const { error: dbError } = await supabase
    .from('users')
    .update({
      name: trimmedName,
      email: trimmedEmail,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (dbError) throw dbError;

  // 2. Sincronizar displayName en Firebase Auth
  try {
    await updateUserProfile(trimmedName);
  } catch (firebaseError) {
    console.warn('[profile] No se pudo actualizar displayName en Firebase:', firebaseError);
  }

  // 3. Refrescar estado global en Zustand
  await useAuthStore.getState().refreshProfile();
}

/** Obtiene la última solicitud de repartidor del usuario. */
export async function fetchUserDriverApplication(
  userId: string,
): Promise<DriverApplication | null> {
  const { data, error } = await supabase
    .from('driver_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[profile] Error al consultar driver_applications:', error);
    return null;
  }
  return data;
}

/** Envía o actualiza la solicitud de repartidor. */
export async function submitDriverApplication(
  input: {
    existingId?: string;
    userId: string;
    dni: string;
    birthDate: string;
    vehicleType: VehicleType;
    fullName: string;
    phone: string;
    email: string | null;
    licenseNumber?: string;
    vehiclePlate?: string;
    vehicleBrand?: string;
    vehicleModel?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
  },
): Promise<DriverApplication> {
  const payload = {
    user_id: input.userId,
    dni: input.dni.trim(),
    birth_date: input.birthDate.trim(),
    vehicle_type: input.vehicleType,
    full_name: input.fullName.trim(),
    phone: input.phone.trim(),
    email: input.email?.trim() || null,
    license_number: input.licenseNumber?.trim() || null,
    vehicle_plate: input.vehiclePlate?.trim() || null,
    vehicle_brand: input.vehicleBrand?.trim() || null,
    vehicle_model: input.vehicleModel?.trim() || null,
    emergency_contact_name: input.emergencyContactName?.trim() || null,
    emergency_contact_phone: input.emergencyContactPhone?.trim() || null,
    status: 'pending' as const,
    updated_at: new Date().toISOString(),
  };

  if (input.existingId) {
    const { data, error } = await supabase
      .from('driver_applications')
      .update(payload)
      .eq('id', input.existingId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('driver_applications')
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/** Obtiene la última solicitud de restaurante del usuario. */
export async function fetchUserRestaurantApplication(
  userId: string,
): Promise<RestaurantApplication | null> {
  const { data, error } = await supabase
    .from('restaurant_applications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[profile] Error al consultar restaurant_applications:', error);
    return null;
  }
  return data;
}

/** Envía o actualiza la solicitud de restaurante. */
export async function submitRestaurantApplication(
  input: {
    existingId?: string;
    userId: string;
    businessName: string;
    businessPhone: string;
    businessEmail?: string;
    address: string;
    categoryId: string;
    city: ApplicationCity;
    ownerName: string;
    ownerDni: string;
    additionalComments?: string;
  },
): Promise<RestaurantApplication> {
  const payload = {
    user_id: input.userId,
    business_name: input.businessName.trim(),
    business_phone: input.businessPhone.trim(),
    business_email: input.businessEmail?.trim() || null,
    address: input.address.trim(),
    category_id: input.categoryId,
    city: input.city,
    owner_name: input.ownerName.trim(),
    owner_dni: input.ownerDni.trim(),
    additional_comments: input.additionalComments?.trim() || null,
    status: 'pending' as const,
    updated_at: new Date().toISOString(),
  };

  if (input.existingId) {
    const { data, error } = await supabase
      .from('restaurant_applications')
      .update(payload)
      .eq('id', input.existingId)
      .select('*')
      .single();

    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('restaurant_applications')
    .insert({
      ...payload,
      created_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

/** Categorías de restaurante activas para el formulario de solicitud. */
export async function fetchCategoriesForApplication(): Promise<
  Pick<RestaurantCategory, 'id' | 'name' | 'icon'>[]
> {
  const { data, error } = await supabase
    .from('restaurant_categories')
    .select('id, name, icon')
    .eq('isActive', true)
    .order('name');

  if (error) throw error;
  return data ?? [];
}
