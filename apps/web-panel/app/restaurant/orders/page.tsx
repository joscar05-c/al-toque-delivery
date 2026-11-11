import { createClient } from '@/utils/supabase/server';
import { createServiceClient } from '@/utils/supabase/service';
import { getSessionUser } from '@/utils/firebase/session';
import { redirect } from 'next/navigation';
import RealtimeBoard from './RealtimeBoard';

import RestaurantSelector from '@/components/RestaurantSelector';

export const dynamic = 'force-dynamic';

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

  const { data: profile } = await supabase
    .from('users')
    .select('role_id')
    .eq('id', user.id)
    .maybeSingle();

  const isAdmin = profile?.role_id === 4;

  let restQuery = supabase
    .from('restaurants')
    .select('id, name, image_url');

  if (!isAdmin) {
    restQuery = restQuery.eq('owner_id', user.id);
  }

  const { data: restaurants, error: restError } = await restQuery.order('name');

  if (restError || !restaurants || restaurants.length === 0) {
    return (
      <div className="text-center py-12">
        <p style={{ color: 'var(--ink-secondary)' }}>
          {isAdmin ? 'No hay restaurantes registrados en la plataforma.' : 'No se encontró un restaurante asociado a tu cuenta.'}
        </p>
      </div>
    );
  }

  const restaurant =
    (resolvedParams?.restaurantId
      ? restaurants.find((r) => r.id === resolvedParams.restaurantId)
      : null) || restaurants[0];

  const [
    { data: deliveryConfig },
    { data: orders, error },
    { data: linkedDriverRows },
  ] = await Promise.all([
    supabase
      .from('restaurant_delivery_config')
      .select('delivery_type, is_delivery_enabled')
      .eq('restaurant_id', restaurant.id)
      .maybeSingle(),
    supabase
      .from('orders')
      .select(`
        id,
        status,
        total,
        notes,
        deliveryAddress,
        fulfillment_type,
        driver_id,
        estimated_prep_time,
        created_at,
        updated_at,
        client_id,
        order_payments (
          id,
          payment_method_code,
          amount,
          payment_status,
          cash_amount,
          change_amount,
          transaction_reference
        )
      `)
      .eq('restaurant_id', restaurant.id)
      .in('status', ['pending', 'accepted', 'preparing', 'ready', 'picked_up'])
      .order('created_at', { ascending: true }),
    createServiceClient()
      .from('restaurant_drivers')
      .select('driver_id, is_active, users:driver_id (id, name, phone, role_id, is_active)')
      .eq('restaurant_id', restaurant.id)
      .eq('is_active', true),
  ]);

  if (error) {
    console.error('Error fetching orders:', error);
    return <div style={{ color: 'var(--danger)' }}>Error al cargar pedidos: {error.message}</div>;
  }

  const serviceSupabase = createServiceClient();
  const orderDriverIds = Array.from(
    new Set(
      (orders ?? [])
        .map((o) => o.driver_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const driverMap = new Map<string, { id: string; name: string | null; phone: string | null }>();
  if (orderDriverIds.length > 0) {
    const { data: orderDrivers } = await serviceSupabase
      .from('users')
      .select('id, name, phone')
      .in('id', orderDriverIds);
    for (const d of orderDrivers ?? []) {
      driverMap.set(d.id, d);
    }
  }

  const rawLinkedDrivers = (linkedDriverRows ?? [])
    .map((row) => {
      const u = Array.isArray(row.users) ? row.users[0] : row.users;
      return u as { id: string; name: string | null; phone: string | null; role_id: number | null; is_active: boolean } | null;
    })
    .filter((u): u is { id: string; name: string | null; phone: string | null; role_id: number | null; is_active: boolean } =>
      Boolean(u && u.role_id === 2 && u.is_active),
    );

  const linkedDriverIds = rawLinkedDrivers.map((d) => d.id);
  const activeCountByDriver = new Map<string, number>();

  if (linkedDriverIds.length > 0) {
    const { data: activeDriverOrders } = await serviceSupabase
      .from('orders')
      .select('driver_id')
      .in('driver_id', linkedDriverIds)
      .in('status', ['accepted', 'preparing', 'ready', 'picked_up']);

    for (const ao of activeDriverOrders ?? []) {
      if (!ao.driver_id) continue;
      activeCountByDriver.set(ao.driver_id, (activeCountByDriver.get(ao.driver_id) ?? 0) + 1);
    }
  }

  const fleetDrivers = rawLinkedDrivers.map((d) => ({
    id: d.id,
    name: d.name ?? 'Repartidor',
    phone: d.phone,
    activeOrdersCount: activeCountByDriver.get(d.id) ?? 0,
  }));

  const enrichedOrders = (orders ?? []).map((o) => ({
    ...o,
    fulfillment_type: (o.fulfillment_type === 'pickup' ? 'pickup' : 'delivery') as 'delivery' | 'pickup',
    driver: o.driver_id ? driverMap.get(o.driver_id) ?? null : null,
  }));

  const deliveryType = deliveryConfig?.is_delivery_enabled
    ? (deliveryConfig.delivery_type ?? 'platform')
    : 'pickup_only';

  return (
    <div>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Pedidos en Vivo</h1>
          <p className="page-subtitle">Cocina y despacho en tiempo real — nuevos pedidos aparecen automáticamente</p>
        </div>
        <RestaurantSelector restaurants={restaurants} currentId={restaurant.id} />
      </div>

      <RealtimeBoard
        initialOrders={enrichedOrders}
        restaurantId={restaurant.id}
        deliveryType={deliveryType as 'platform' | 'restaurant_own' | 'pickup_only'}
        fleetDrivers={fleetDrivers}
      />
    </div>
  );
}
