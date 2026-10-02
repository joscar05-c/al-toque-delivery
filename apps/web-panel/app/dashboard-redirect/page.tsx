'use server';

import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';

export default async function DashboardRedirect() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log('[DashboardRedirect] user:', user?.id, user?.email);

  if (!user) {
    console.log('[DashboardRedirect] no user, redirecting to login');
    redirect('/login');
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role_id, email, name')
    .eq('id', user.id)
    .single();

  console.log('[DashboardRedirect] profile:', profile, 'error:', profileError);

  if (profile?.role_id === 4) {
    console.log('[DashboardRedirect] role=4, redirecting to /admin/applications');
    redirect('/admin/applications');
  }
  if (profile?.role_id === 3) {
    console.log('[DashboardRedirect] role=3, redirecting to /restaurant/orders');
    redirect('/restaurant/orders');
  }

  console.log('[DashboardRedirect] access denied, role_id:', profile?.role_id);
  await supabase.auth.signOut();
  redirect('/login?error=Acceso denegado');
}