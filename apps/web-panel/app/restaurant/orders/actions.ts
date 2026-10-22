'use server';

import { authorizeRestaurantOwner } from '@/utils/firebase/authorization';
import { revalidatePath } from 'next/cache';

const VALID_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'] as const;
type OrderStatus = typeof VALID_STATUSES[number];

export async function updateOrderStatus(orderId: string, status: string, restaurantId?: string) {
  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    return { error: 'Estado inválido' };
  }

  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { data, error } = await access.supabase
    .from('orders')
    .update({ status: status as OrderStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .eq('restaurant_id', access.restaurantId)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error updating order status:', error);
    return { error: 'Error al actualizar el estado' };
  }
  if (!data) return { error: 'Pedido no encontrado o no autorizado' };

  revalidatePath('/restaurant/orders');
  revalidatePath('/admin/orders');
  return { success: true };
}
