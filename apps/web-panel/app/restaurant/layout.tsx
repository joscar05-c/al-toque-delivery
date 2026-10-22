import { getSessionUser } from '@/utils/firebase/session';
import { createClient } from '@/utils/supabase/server';
import RestaurantLayoutClient from './RestaurantLayoutClient';

export const dynamic = 'force-dynamic';

export default async function RestaurantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  let isAdmin = false;

  if (user) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('users')
      .select('role_id')
      .eq('id', user.id)
      .maybeSingle();

    isAdmin = profile?.role_id === 4;
  }

  return (
    <RestaurantLayoutClient isAdmin={isAdmin}>
      {children}
    </RestaurantLayoutClient>
  );
}
