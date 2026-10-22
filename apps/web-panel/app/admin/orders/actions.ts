'use server';

import { revalidatePath } from 'next/cache';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

export async function cancelOrder(orderId: string, reason: string) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const trimmedReason = reason?.trim();
  if (!trimmedReason) {
    return { error: 'Debes indicar el motivo de la cancelación.' };
  }

  // Get current order notes to append cancellation reason
  const { data: order, error: fetchError } = await access.supabase
    .from('orders')
    .select('id, notes, status')
    .eq('id', orderId)
    .single();

  if (fetchError || !order) {
    return { error: 'Pedido no encontrado.' };
  }

  if (order.status === 'cancelled') {
    return { error: 'El pedido ya está cancelado.' };
  }

  const updatedNotes = order.notes
    ? `${order.notes} | [Cancelado por Admin]: ${trimmedReason}`
    : `[Cancelado por Admin]: ${trimmedReason}`;

  const { error } = await access.supabase
    .from('orders')
    .update({
      status: 'cancelled',
      notes: updatedNotes,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('[cancelOrder] Error:', error);
    return { error: error.message || 'Error al cancelar pedido.' };
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { success: true };
}

export async function updateOrderStatus(orderId: string, newStatus: string) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const validStatuses = ['pending', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
  if (!validStatuses.includes(newStatus)) {
    return { error: 'Estado de pedido no válido.' };
  }

  const { error } = await access.supabase
    .from('orders')
    .update({
      status: newStatus as any,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('[updateOrderStatus] Error:', error);
    return { error: error.message || 'Error al actualizar estado del pedido.' };
  }

  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  return { success: true };
}
