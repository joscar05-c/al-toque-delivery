import { redirect } from 'next/navigation';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';
import OrdersManager from './OrdersManager';
import { OrderDetailItem } from './OrderDetailModal';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) redirect('/dashboard-redirect');

  // Fetch orders with nested restaurant, payments and items
  const { data: rawOrders, error: ordersError } = await access.supabase
    .from('orders')
    .select(`
      id,
      status,
      total,
      notes,
      deliveryAddress,
      created_at,
      updated_at,
      client_id,
      driver_id,
      restaurant_id,
      restaurant:restaurants(id, name, city, phone, address),
      order_payments(id, payment_method_code, amount, payment_status, payment_proof_url, transaction_reference, cash_amount, change_amount),
      order_items(id, quantity, unit_price, comment, options, menu_items(name))
    `)
    .order('created_at', { ascending: false });

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

  let userMap = new Map<string, any>();
  if (userIds.length > 0) {
    const { data: usersData } = await access.supabase
      .from('users')
      .select('id, name, phone, email')
      .in('id', userIds);

    if (usersData) {
      userMap = new Map(usersData.map((u) => [u.id, u]));
    }
  }

  // Combine into OrderDetailItem
  const orders: OrderDetailItem[] = ordersList.map((o: any) => ({
    ...o,
    client: o.client_id ? userMap.get(o.client_id) || null : null,
    driver: o.driver_id ? userMap.get(o.driver_id) || null : null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Monitor Global de Pedidos</h1>
        <p className="page-subtitle">
          Supervisa en vivo todos los pedidos de la plataforma en todas las ciudades y restaurantes afiliados.
        </p>
      </div>

      <OrdersManager orders={orders} />
    </div>
  );
}
