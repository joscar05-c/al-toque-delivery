'use server';

import { createClient } from '@/utils/supabase/server';
import { getSessionUser } from '@/utils/firebase/session';
import { revalidatePath } from 'next/cache';

const VALID_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'] as const;
type OrderStatus = typeof VALID_STATUSES[number];

export async function updateOrderStatus(orderId: string, status: string) {
  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    return { error: 'Estado inválido' };
  }

  const supabase = await createClient();

  const user = await getSessionUser();

  if (!user) {
    return { error: 'No autenticado' };
  }

  const { error } = await supabase
    .from('orders')
    .update({ status: status as OrderStatus, updated_at: new Date().toISOString() })
    .eq('id', orderId);

  if (error) {
    console.error('Error updating order status:', error);
    return { error: 'Error al actualizar el estado' };
  }

  revalidatePath('/restaurant/orders');
  return { success: true };
}