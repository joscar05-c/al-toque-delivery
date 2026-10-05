import { redirect } from 'next/navigation';

import { clearSessionCookie, getSessionUser } from '@/utils/firebase/session';
import { createClient } from '@/utils/supabase/server';

export default async function DashboardRedirect() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from('users')
    .select('role_id, email, name')
    .eq('id', user.id)
    .single();

  if (profile?.role_id === 4) {
    redirect('/admin/applications');
  }
  if (profile?.role_id === 3) {
    redirect('/restaurant/orders');
  }

  // Rol no autorizado para el panel: se cierra la sesión.
  await clearSessionCookie();
  redirect('/login?error=Acceso%20denegado');
}