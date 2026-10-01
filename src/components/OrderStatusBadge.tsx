import { Text, View } from 'react-native';

import type { Enums } from '@/types/database.types';

type OrderStatus = Enums<'orders_status_enum'>;

// Color + etiqueta por estado (clases literales: las escanea Tailwind).
const STATUS_CONFIG: Record<OrderStatus, { label: string; bg: string; text: string }> = {
  pending: { label: 'Pendiente', bg: 'bg-slate-100', text: 'text-slate-600' },
  accepted: { label: 'Aceptado', bg: 'bg-blue-100', text: 'text-blue-700' },
  preparing: { label: 'Preparando', bg: 'bg-orange-100', text: 'text-orange-700' },
  ready: { label: 'Listo', bg: 'bg-violet-100', text: 'text-violet-700' },
  picked_up: { label: 'En camino', bg: 'bg-cyan-100', text: 'text-cyan-700' },
  delivered: { label: 'Entregado', bg: 'bg-green-100', text: 'text-green-700' },
  cancelled: { label: 'Cancelado', bg: 'bg-red-100', text: 'text-red-600' },
};

/** Badge de estado del pedido (reutilizable en cliente y repartidor). */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <View className={`self-start rounded-full px-2.5 py-1 ${config.bg}`}>
      <Text className={`text-xs font-semibold ${config.text}`}>
        {config.label}
      </Text>
    </View>
  );
}
