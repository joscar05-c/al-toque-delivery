import { supabase } from '@/lib/supabase';
import type {
  DriverOrderRpcRow,
  DriverTypeCode,
  Order,
  Restaurant,
  User,
} from '@delivery/shared';

export type DriverOrder = Order & {
  client: Pick<User, 'name' | 'phone'> | null;
  restaurant: Pick<
    Restaurant,
    'id' | 'name' | 'address' | 'phone' | 'city' | 'latitude' | 'longitude'
  > | null;
  delivery_type: string | null;
};

export interface DriverOrdersResult {
  assigned: boolean;
  driverType: DriverTypeCode;
  linkedRestaurantsCount: number;
  orders: DriverOrder[];
}

function mapDriverOrderRow(row: DriverOrderRpcRow): DriverOrder {
  return {
    id: row.id,
    status: row.status,
    total: Number(row.total),
    notes: row.notes,
    deliveryAddress: row.deliveryAddress,
    delivery_latitude: row.delivery_latitude,
    delivery_longitude: row.delivery_longitude,
    fulfillment_type: row.fulfillment_type,
    estimated_prep_time: row.estimated_prep_time,
    estimated_ready_time: row.estimated_ready_time,
    confirmed_at: row.confirmed_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    client_id: row.client_id,
    driver_id: row.driver_id,
    restaurant_id: row.restaurant_id,
    delivery_type: row.delivery_type,
    client:
      row.client_name || row.client_phone
        ? { name: row.client_name ?? 'Cliente', phone: row.client_phone }
        : null,
    restaurant: row.restaurant_id
      ? {
        id: row.restaurant_id,
        name: row.restaurant_name ?? 'Restaurante',
        address: row.restaurant_address ?? '',
        phone: row.restaurant_phone ?? '',
        city: (row.restaurant_city as Restaurant['city']) ?? null,
        latitude: row.restaurant_latitude,
        longitude: row.restaurant_longitude,
      }
      : null,
  };
}

/**
 * Pedidos activos (o historial) visibles para el repartidor vía RPC segura:
 * - Si `driverType === 'platform'`: locales con `delivery_type = 'platform'` activos.
 * - Si `driverType === 'restaurant_own'`: locales vinculados en `restaurant_drivers` con `delivery_type = 'restaurant_own'`.
 */
export async function fetchDriverOrders(
  driverId: string,
  includeHistory = false,
): Promise<DriverOrdersResult> {
  const [rpcRes, profileRes, assignmentsRes, platformRes] = await Promise.all([
    supabase.rpc('get_driver_orders', { p_include_history: includeHistory }),
    supabase
      .from('driver_profiles')
      .select('driver_type_code')
      .eq('user_id', driverId)
      .maybeSingle(),
    supabase
      .from('restaurant_drivers')
      .select('restaurant_id')
      .eq('driver_id', driverId)
      .eq('is_active', true),
    supabase
      .from('restaurant_delivery_config')
      .select('restaurant_id')
      .eq('is_delivery_enabled', true)
      .eq('delivery_type', 'platform')
      .limit(1),
  ]);

  if (rpcRes.error) throw rpcRes.error;

  const driverType: DriverTypeCode =
    profileRes.data?.driver_type_code === 'restaurant_own'
      ? 'restaurant_own'
      : 'platform';
  const linkedRestaurantsCount = assignmentsRes.data?.length ?? 0;

  const hasPoolAccess =
    driverType === 'platform'
      ? (platformRes.data?.length ?? 0) > 0
      : linkedRestaurantsCount > 0;

  return {
    assigned: hasPoolAccess || (rpcRes.data?.length ?? 0) > 0,
    driverType,
    linkedRestaurantsCount,
    orders: (rpcRes.data ?? []).map(mapDriverOrderRow),
  };
}

/** Detalle de un pedido visible para el repartidor (sin chocar con RLS de users). */
export async function fetchDriverOrderById(
  orderId: string,
): Promise<DriverOrder | null> {
  const { data, error } = await supabase.rpc('get_driver_order_detail', {
    p_order_id: orderId,
  });

  if (error) throw error;
  const row = data?.[0];
  return row ? mapDriverOrderRow(row) : null;
}

/** Toma un pedido disponible atómicamente (evita condiciones de carrera entre repartidores). */
export async function claimDriverOrder(orderId: string): Promise<Order> {
  const { data, error } = await supabase.rpc('driver_claim_order', {
    p_order_id: orderId,
  });

  if (error) throw error;
  return data;
}
