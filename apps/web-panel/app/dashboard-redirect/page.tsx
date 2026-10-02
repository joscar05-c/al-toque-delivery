'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardRedirect() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role_id')
    .eq('id', user.id)
    .single();

  if (profile?.role_id === 4) {
    redirect('/admin/applications');
  }
  if (profile?.role_id === 3) {
    redirect('/restaurant/orders');
  }

  await supabase.auth.signOut();
  redirect('/login?error=Acceso denegado');
}