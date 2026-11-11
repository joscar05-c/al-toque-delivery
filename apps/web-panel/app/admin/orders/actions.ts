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
      status: newStatus as
        | 'pending'
        | 'accepted'
        | 'preparing'
        | 'ready'
        | 'picked_up'
        | 'delivered'
        | 'cancelled',
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

export async function assignOrderDriver(orderId: string, driverId: string | null) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { data: order, error: orderError } = await access.supabase
    .from('orders')
    .select('id, restaurant_id, fulfillment_type, status')
    .eq('id', orderId)
    .maybeSingle();

  if (orderError || !order) {
    return { error: 'Pedido no encontrado.' };
  }

  if (order.fulfillment_type !== 'delivery') {
    return { error: 'Los pedidos de recojo en tienda no llevan repartidor.' };
  }

  if (driverId) {
    const [{ data: userRow }, { data: profileRow }, { data: configRow }] = await Promise.all([
      access.supabase
        .from('users')
        .select('id, role_id, is_active')
        .eq('id', driverId)
        .maybeSingle(),
      access.supabase
        .from('driver_profiles')
        .select('driver_type_code')
        .eq('user_id', driverId)
        .maybeSingle(),
      order.restaurant_id
        ? access.supabase
            .from('restaurant_delivery_config')
            .select('delivery_type, is_delivery_enabled')
            .eq('restaurant_id', order.restaurant_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (!userRow || userRow.role_id !== 2 || !userRow.is_active) {
      return { error: 'El repartidor seleccionado no está activo.' };
    }

    const driverType = profileRow?.driver_type_code ?? 'platform';
    const restDeliveryType = configRow?.delivery_type ?? 'platform';

    if (restDeliveryType === 'platform' && driverType !== 'platform') {
      return {
        error:
          'Este restaurante opera con Red Al Toque; solo puedes asignar repartidores de plataforma.',
      };
    }

    if (restDeliveryType === 'restaurant_own') {
      if (driverType !== 'restaurant_own') {
        return {
          error:
            'Este restaurante opera con Flota Propia; solo puedes asignar repartidores de Flota Propia vinculados.',
        };
      }

      if (order.restaurant_id) {
        const { data: linkRow } = await access.supabase
          .from('restaurant_drivers')
          .select('id')
          .eq('restaurant_id', order.restaurant_id)
          .eq('driver_id', driverId)
          .eq('is_active', true)
          .maybeSingle();

        if (!linkRow) {
          return {
            error: 'El repartidor de Flota Propia no está vinculado a este restaurante.',
          };
        }
      }
    }
  }

  const { error } = await access.supabase
    .from('orders')
    .update({
      driver_id: driverId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  if (error) {
    console.error('[assignOrderDriver] Error:', error);
    return { error: error.message || 'No se pudo asignar el repartidor.' };
  }

  revalidatePath('/admin/orders');
  revalidatePath('/restaurant/orders');
  return { success: true };
}
