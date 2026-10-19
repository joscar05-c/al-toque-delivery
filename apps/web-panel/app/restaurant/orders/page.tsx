import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { redirect } from 'next/navigation';
import RealtimeBoard from './RealtimeBoard';

import RestaurantSelector from '@/components/RestaurantSelector';

interface PageProps {
  searchParams: Promise<{ restaurantId?: string }>;
}

export default async function RestaurantOrdersPage({ searchParams }: PageProps) {
  const supabase = await createClient();

  const user = await getSessionUser();

  if (!user) {
    redirect('/login');
  }

  const resolvedParams = await searchParams;

  const { data: restaurants, error: restError } = await supabase
    .from('restaurants')
    .select('id, name, image_url')
    .eq('owner_id', user.id)
    .order('name');

  if (restError || !restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--ink-secondary)' }}>No se encontró un restaurante asociado a tu cuenta.</p>
      </div>
    );
  }

  const restaurant =
    (resolvedParams?.restaurantId
      ? restaurants.find((r) => r.id === resolvedParams.restaurantId)
      : null) || restaurants[0];

  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, status, total, notes, deliveryAddress, estimated_prep_time, created_at, client_id')
    .eq('restaurant_id', restaurant.id)
    .in('status', ['pending', 'accepted', 'preparing', 'ready'])
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching orders:', error);
    return <div style={{ color: 'var(--danger)' }}>Error al cargar pedidos: {error.message}</div>;
  }

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Pedidos en Vivo</h1>
          <p className="page-subtitle">Cocina en tiempo real — nuevos pedidos aparecen automáticamente</p>
        </div>
        <RestaurantSelector restaurants={restaurants} currentId={restaurant.id} />
      </div>

      <RealtimeBoard initialOrders={orders ?? []} restaurantId={restaurant.id} />
    </div>
  );
}
