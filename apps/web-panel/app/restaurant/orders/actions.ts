'use server';

import { authorizeRestaurantOwner } from '@/utils/firebase/authorization';
import { createServiceClient } from '@/utils/supabase/service';
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
    .select('id, status, driver_id')
    .maybeSingle();

  if (error) {
    console.error('Error updating order status:', error);
    return { error: 'Error al actualizar el estado' };
  }
  if (!data) return { error: 'Pedido no encontrado o no autorizado' };

  revalidatePath('/restaurant/orders');
  revalidatePath('/admin/orders');
  return { success: true, driverId: data.driver_id };
}

/** Auto-asigna el pedido de Flota Propia al repartidor con menos entregas activas (0 primero). */
export async function autoAssignRestaurantOrder(orderId: string, restaurantId?: string) {
  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const { data: orderCheck } = await access.supabase
    .from('orders')
    .select('id')
    .eq('id', orderId)
    .eq('restaurant_id', access.restaurantId)
    .maybeSingle();

  if (!orderCheck) {
    return { error: 'Pedido no encontrado en este restaurante' };
  }

  const { data: assignedDriverId, error } = await access.supabase.rpc(
    'auto_assign_restaurant_driver',
    { p_order_id: orderId },
  );

  if (error) {
    console.error('Error auto-assigning driver:', error);
    return { error: error.message || 'No se pudo auto-asignar repartidor' };
  }

  if (!assignedDriverId) {
    return {
      error:
        'No hay repartidores activos de Flota Propia vinculados a este restaurante. Agrégalos en Configuración.',
    };
  }

  revalidatePath('/restaurant/orders');
  revalidatePath('/admin/orders');
  return { success: true, driverId: assignedDriverId };
}

/** Asigna o reasigna manualmente un repartidor propio vinculado en Flota Propia. */
export async function assignRestaurantOrderDriver(
  orderId: string,
  driverId: string | null,
  restaurantId?: string,
) {
  const access = await authorizeRestaurantOwner(restaurantId);
  if (!access) return { error: 'No autorizado para este restaurante' };

  const serviceSupabase = createServiceClient();

  const { data: deliveryConfig } = await serviceSupabase
    .from('restaurant_delivery_config')
    .select('delivery_type, is_delivery_enabled')
    .eq('restaurant_id', access.restaurantId)
    .maybeSingle();

  if (
    !deliveryConfig?.is_delivery_enabled ||
    deliveryConfig.delivery_type !== 'restaurant_own'
  ) {
    return {
      error:
        'La asignación directa desde cocina solo está disponible cuando el restaurante opera con Flota Propia.',
    };
  }

  if (driverId) {
    const { data: link } = await serviceSupabase
      .from('restaurant_drivers')
      .select('id, is_active')
      .eq('restaurant_id', access.restaurantId)
      .eq('driver_id', driverId)
      .eq('is_active', true)
      .maybeSingle();

    if (!link) {
      return { error: 'Este repartidor no está vinculado y activo en la flota de tu restaurante.' };
    }

    const [{ data: userRow }, { data: profileRow }] = await Promise.all([
      serviceSupabase
        .from('users')
        .select('role_id, is_active')
        .eq('id', driverId)
        .maybeSingle(),
      serviceSupabase
        .from('driver_profiles')
        .select('driver_type_code')
        .eq('user_id', driverId)
        .maybeSingle(),
    ]);

    if (
      userRow?.role_id !== 2 ||
      !userRow.is_active ||
      profileRow?.driver_type_code !== 'restaurant_own'
    ) {
      return { error: 'El repartidor no está habilitado como Flota Propia.' };
    }
  }

  const { data: updated, error } = await serviceSupabase
    .from('orders')
    .update({
      driver_id: driverId || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('restaurant_id', access.restaurantId)
    .eq('fulfillment_type', 'delivery')
    .in('status', ['pending', 'accepted', 'preparing', 'ready', 'picked_up'])
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Error assigning restaurant driver:', error);
    return { error: error.message || 'Error al asignar repartidor' };
  }
  if (!updated) {
    return { error: 'Pedido no encontrado, ya entregado o configurado como recojo en tienda.' };
  }

  revalidatePath('/restaurant/orders');
  revalidatePath('/admin/orders');
  return { success: true };
}
