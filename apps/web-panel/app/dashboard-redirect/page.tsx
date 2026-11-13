import { redirect } from 'next/navigation';

import { getSessionUser } from '@/utils/firebase/session';
import { createClient } from '@/utils/supabase/server';

export default async function DashboardRedirect() {
  const user = await getSessionUser();

  if (!user) {
    redirect('/login?logout=1');
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

  // Rol no autorizado para el panel: el middleware limpiará la cookie al llegar a /login?logout=1
  redirect('/login?error=Acceso%20denegado&logout=1');
}