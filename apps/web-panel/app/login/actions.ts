'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Email y contraseña requeridos' };
  }

  const supabase = await createClient();

  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { error: authError.message };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No se pudo obtener la sesión' };
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    return { error: 'Perfil no encontrado' };
  }

  const roleId = profile.role_id ?? 0;

  if (roleId === 4) {
    redirect('/admin/applications');
  }
  if (roleId === 3) {
    redirect('/restaurant/orders');
  }

  await supabase.auth.signOut();
  return { error: 'No tienes acceso al panel web' };
}