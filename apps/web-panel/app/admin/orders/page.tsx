import { redirect } from 'next/navigation';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';
import OrdersManager from './OrdersManager';
import { OrderDetailItem } from './OrderDetailModal';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) redirect('/dashboard-redirect');

  // Fetch orders, active drivers and restaurant_drivers links in parallel
  const [
    { data: rawOrders, error: ordersError },
    { data: rawDriverUsers },
    { data: rawDriverProfiles },
    { data: rawRestLinks },
    { data: rawDeliveryConfigs },
  ] = await Promise.all([
    access.supabase
      .from('orders')
      .select(`
        id,
        status,
        total,
        notes,
        deliveryAddress,
        fulfillment_type,
        created_at,
        updated_at,
        client_id,
        driver_id,
        restaurant_id,
        restaurant:restaurants(id, name, city, phone, address),
        order_payments(id, payment_method_code, amount, payment_status, payment_proof_url, transaction_reference, cash_amount, change_amount),
        order_items(id, quantity, unit_price, comment, options, menu_items(name))
      `)
      .order('created_at', { ascending: false }),
    access.supabase
      .from('users')
      .select('id, name, phone')
      .eq('role_id', 2)
      .eq('is_active', true)
      .order('name'),
    access.supabase
      .from('driver_profiles')
      .select('user_id, driver_type_code'),
    access.supabase
      .from('restaurant_drivers')
      .select('restaurant_id, driver_id')
      .eq('is_active', true),
    access.supabase
      .from('restaurant_delivery_config')
      .select('restaurant_id, delivery_type, is_delivery_enabled'),
  ]);

  if (ordersError) {
    console.error('[AdminOrdersPage] Error cargando pedidos:', ordersError);
    return (
      <div className="section-card p-5" style={{ color: 'var(--danger)' }}>
        <p className="font-semibold text-sm">Error al cargar pedidos globales</p>
        <p className="text-xs mt-1 opacity-80">{ordersError.message}</p>
      </div>
    );
  }

  const ordersList = rawOrders ?? [];

  // Extract client and driver IDs to fetch users safely
  const userIds = Array.from(
    new Set(
      ordersList
        .flatMap((o) => [o.client_id, o.driver_id])
        .filter((id): id is string => Boolean(id))
    )
  );

  let userMap = new Map<string, { id: string; name: string | null; phone: string | null; email: string | null }>();
  if (userIds.length > 0) {
    const { data: usersData } = await access.supabase
      .from('users')
      .select('id, name, phone, email')
      .in('id', userIds);

    if (usersData) {
      userMap = new Map(usersData.map((u) => [u.id, u]));
    }
  }

  const deliveryConfigMap = new Map(
    (rawDeliveryConfigs ?? []).map((c) => [c.restaurant_id, c]),
  );

  // Combine into OrderDetailItem
  const orders: OrderDetailItem[] = ordersList.map((o) => {
    const cfg = o.restaurant_id ? deliveryConfigMap.get(o.restaurant_id) : null;
    const deliveryType = cfg
      ? cfg.is_delivery_enabled
        ? cfg.delivery_type
        : 'pickup_only'
      : 'platform';
    return {
      ...o,
      fulfillment_type: o.fulfillment_type === 'pickup' ? 'pickup' : 'delivery',
      delivery_type: deliveryType,
      order_payments: o.order_payments
        ? Array.isArray(o.order_payments)
          ? o.order_payments
          : [o.order_payments]
        : null,
      client: o.client_id ? userMap.get(o.client_id) || null : null,
      driver: o.driver_id ? userMap.get(o.driver_id) || null : null,
    };
  });

  const driverTypeById = new Map(
    (rawDriverProfiles ?? []).map((dp) => [dp.user_id, dp.driver_type_code]),
  );

  const restLinksByDriver = new Map<string, string[]>();
  for (const link of rawRestLinks ?? []) {
    const arr = restLinksByDriver.get(link.driver_id) ?? [];
    arr.push(link.restaurant_id);
    restLinksByDriver.set(link.driver_id, arr);
  }

  const availableDrivers = (rawDriverUsers ?? []).map((d) => ({
    id: d.id,
    name: d.name ?? 'Repartidor',
    phone: d.phone,
    driver_type_code: (driverTypeById.get(d.id) === 'restaurant_own'
      ? 'restaurant_own'
      : 'platform') as 'platform' | 'restaurant_own',
    linked_restaurant_ids: restLinksByDriver.get(d.id) ?? [],
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Monitor Global de Pedidos</h1>
        <p className="page-subtitle">
          Supervisa en vivo todos los pedidos de la plataforma en todas las ciudades y restaurantes afiliados.
        </p>
      </div>

      <OrdersManager orders={orders} availableDrivers={availableDrivers} />
    </div>
  );
}
