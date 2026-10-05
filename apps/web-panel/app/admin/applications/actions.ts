'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { revalidatePath } from 'next/cache';

export async function approveRestaurant(applicationId: string) {
  const supabase = await createClient();

  const admin = await getSessionUser();

  if (!admin) {
    return { error: 'No autenticado' };
  }

  const { data: app, error: fetchError } = await supabase
    .from('restaurant_applications')
    .select('*')
    .eq('id', applicationId)
    .single();

  if (fetchError || !app) {
    return { error: 'Solicitud no encontrada' };
  }

  if (app.status !== 'pending') {
    return { error: 'La solicitud ya fue procesada' };
  }

  const { data: newRestaurant, error: insertError } = await supabase
    .from('restaurants')
    .insert({
      name: app.business_name,
      address: app.address,
      phone: app.business_phone,
      city: app.city,
      is_active: true,
      owner_id: app.user_id,
      average_prep_time: 30,
      restaurant_category_id: app.category_id,
    })
    .select()
    .single();

  if (insertError || !newRestaurant) {
    console.error('Error inserting restaurant:', insertError);
    return { error: 'Error al crear el restaurante' };
  }

  const { error: updateAppError } = await supabase
    .from('restaurant_applications')
    .update({
      status: 'approved',
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
      restaurant_id: newRestaurant.id,
    })
    .eq('id', applicationId);

  if (updateAppError) {
    console.error('Error updating application:', updateAppError);
    return { error: 'Error al actualizar la solicitud' };
  }

  const { error: updateUserError } = await supabase
    .from('users')
    .update({ role_id: 3 })
    .eq('id', app.user_id);

  if (updateUserError) {
    console.error('Error updating user role:', updateUserError);
    return { error: 'Error al actualizar rol de usuario' };
  }

  revalidatePath('/admin/applications');
  return { success: true };
}