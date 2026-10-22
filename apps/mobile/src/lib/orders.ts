import { supabase } from '@/lib/supabase';
import type { CartLine } from '@/store/cartStore';
import type {
  Address,
  MenuItem,
  Order,
  OrderItem,
  OrderPayment,
  PaymentMethod,
  Restaurant,
  TablesInsert,
} from '@delivery/shared';

/** Pedido con datos b├ísicos del restaurante embebido (join N:1). */
export type OrderWithRestaurant = Order & {
  restaurants: Pick<Restaurant, 'name' | 'image_url'> | null;
};

/** Pedido con datos de contacto del restaurante para el detalle. */
export type OrderDetail = Order & {
  restaurants: Pick<Restaurant, 'name' | 'phone' | 'address'> | null;
};

/** Item del pedido con nombre e imagen del plato (join N:1). */
export type OrderItemWithMenuItem = OrderItem & {
  menu_items: Pick<MenuItem, 'name' | 'image_url'> | null;
};

export interface OrderFullDetail {
  order: OrderDetail;
  items: OrderItemWithMenuItem[];
  payment: OrderPayment | null;
}

/** Pedidos del cliente, más recientes primero. */
export async function fetchClientOrders(
  clientId: string,
): Promise<OrderWithRestaurant[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('*, restaurants(name, image_url)')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  // Cast expl├¡cito: la forma del join la documenta el DTO.
  return (data ?? []) as OrderWithRestaurant[];
}

/** Detalle completo: pedido + restaurante, items + platos, y pago (1:1). */
export async function fetchOrderDetail(
  orderId: string,
): Promise<OrderFullDetail> {
  const [orderRes, itemsRes, paymentRes] = await Promise.all([
    supabase
      .from('orders')
      .select('*, restaurants(name, phone, address)')
      .eq('id', orderId)
      .single(),
    supabase
      .from('order_items')
      .select('*, menu_items(name, image_url)')
      .eq('order_id', orderId),
    supabase
      .from('order_payments')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle(),
  ]);

  if (orderRes.error) throw orderRes.error;
  if (itemsRes.error) throw itemsRes.error;
  if (paymentRes.error) throw paymentRes.error;

  return {
    order: orderRes.data as OrderDetail,
    items: (itemsRes.data ?? []) as OrderItemWithMenuItem[],
    payment: paymentRes.data,
  };
}

export interface CreateOrderInput {
  clientId: string;
  restaurantId: string;
  address?: Address | null;
  deliveryType?: 'platform' | 'restaurant_own' | 'pickup_only';
  restaurantAddress?: string | null;
  paymentMethod: PaymentMethod;
  lines: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  cashAmount?: number | null;
  changeAmount?: number | null;
  transactionReference?: string | null;
  paymentProofUrl?: string | null;
}

/**
 * Crea el pedido completo: orders -> order_items -> order_payments.
 * Soporta entrega a domicilio o recojo en local, y detalles de efectivo o transferencia.
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const isPickup = input.deliveryType === 'pickup_only' || !input.address;
  const deliveryAddress = isPickup
    ? `Recojo en Tienda${input.restaurantAddress ? ` · ${input.restaurantAddress}` : ''}`
    : `${input.address?.street}, ${input.address?.city}` +
      (input.address?.reference ? ` · ${input.address?.reference}` : '');

  // 1. Cabecera del pedido (deliveryAddress = texto plano de la dirección o Recojo en Tienda).
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      client_id: input.clientId,
      restaurant_id: input.restaurantId,
      deliveryAddress,
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
      unit_price: line.unitPrice,
      options:
        line.selectedOptions && line.selectedOptions.length > 0
          ? (line.selectedOptions as unknown as TablesInsert<'order_items'>['options'])
          : null,
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
        cash_amount: input.cashAmount ?? null,
        change_amount: input.changeAmount ?? null,
        transaction_reference: input.transactionReference ?? null,
        payment_proof_url: input.paymentProofUrl ?? null,
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
