import { supabase } from '@/lib/supabase';
import type { CartLine } from '@/store/cartStore';
import type {
  Address,
  Order,
  PaymentMethod,
  TablesInsert,
} from '@/types/database.types';

export interface CreateOrderInput {
  clientId: string;
  restaurantId: string;
  address: Address;
  paymentMethod: PaymentMethod;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

/**
 * Crea el pedido completo: orders -> order_items -> order_payments.
 * Supabase JS no tiene transacciones multi-tabla: si falla un paso
 * posterior, se intenta borrar la cabecera (best-effort según RLS).
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  // 1. Cabecera del pedido (deliveryAddress = texto plano de la dirección).
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      client_id: input.clientId,
      restaurant_id: input.restaurantId,
      deliveryAddress:
        `${input.address.street}, ${input.address.city}` +
        (input.address.reference ? ` · ${input.address.reference}` : ''),
      total: input.total,
      status: 'pending',
    } satisfies TablesInsert<'orders'>)
    .select()
    .single();

  if (orderError) throw orderError;

  try {
    // 2. Items del pedido (insert múltiple).
    const items: TablesInsert<'order_items'>[] = input.lines.map((line) => ({
      order_id: order.id,
      menu_item_id: line.item.id,
      quantity: line.quantity,
      unit_price: line.item.price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(items);
    if (itemsError) throw itemsError;

    // 3. Pago del pedido.
    const { error: paymentError } = await supabase
      .from('order_payments')
      .insert({
        order_id: order.id,
        payment_method_code: input.paymentMethod.code,
        amount: input.total,
        delivery_fee: input.deliveryFee,
        subtotal: input.subtotal,
        payment_status: 'pending',
      } satisfies TablesInsert<'order_payments'>);
    if (paymentError) throw paymentError;

    return order;
  } catch (e) {
    // Rollback compensatorio best-effort (depende de policy DELETE en orders).
    await supabase.from('orders').delete().eq('id', order.id);
    throw e;
  }
}
