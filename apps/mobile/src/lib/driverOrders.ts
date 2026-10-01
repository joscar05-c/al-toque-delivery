import { supabase } from '@/lib/supabase';
import type { Order, User } from '@/types/database.types';

export type DriverOrder = Order & {
  client: Pick<User, 'name'> | null;
};

export interface DriverOrdersResult {
  assigned: boolean;
  orders: DriverOrder[];
}

/** Pedidos activos del restaurante asignado al repartidor. */
export async function fetchDriverOrders(
  driverId: string,
): Promise<DriverOrdersResult> {
  const { data: assignments, error: assignmentError } = await supabase
    .from('restaurant_drivers')
    .select('restaurant_id')
    .eq('driver_id', driverId)
    .eq('is_active', true);

  if (assignmentError) throw assignmentError;

  const restaurantIds = [...new Set((assignments ?? []).map((row) => row.restaurant_id))];
  if (restaurantIds.length === 0) return { assigned: false, orders: [] };

  const { data, error } = await supabase
    .from('orders')
    // deliveryAddress is an order-time snapshot; orders has no address FK.
    .select('*, client:users!FK_505ba3689ef2763acd6c4fc93a4(name)')
    .in('restaurant_id', restaurantIds)
    .neq('status', 'delivered')
    .neq('status', 'cancelled')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return {
    assigned: true,
    orders: (data ?? []) as DriverOrder[],
  };
}
