'use client';

import { OrderDetailItem } from './OrderDetailModal';
import { Eye, Store, User, Clock } from 'lucide-react';

interface OrderRowProps {
  order: OrderDetailItem;
  onViewDetail: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Pendiente', color: '#D97706', bg: 'rgba(217, 119, 6, 0.1)' },
  accepted: { label: 'Aceptado', color: '#2563EB', bg: 'rgba(37, 99, 235, 0.1)' },
  preparing: { label: 'En Preparación', color: '#EA580C', bg: 'rgba(234, 88, 12, 0.1)' },
  ready: { label: 'Listo', color: '#059669', bg: 'rgba(5, 150, 105, 0.1)' },
  picked_up: { label: 'En Camino', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)' },
  delivered: { label: 'Entregado', color: '#16A34A', bg: 'rgba(22, 163, 74, 0.1)' },
  cancelled: { label: 'Cancelado', color: '#DC2626', bg: 'rgba(220, 38, 38, 0.1)' },
};

export default function OrderRow({ order, onViewDetail }: OrderRowProps) {
  const status = STATUS_LABELS[order.status] || STATUS_LABELS.pending;

  return (
    <tr>
      {/* ID & Fecha */}
      <td>
        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
          #{order.id.slice(0, 8)}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-400 mt-0.5">
          <Clock style={{ width: '11px', height: '11px' }} />
          <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          <span>·</span>
          <span>{new Date(order.created_at).toLocaleDateString()}</span>
        </div>
      </td>

      {/* Restaurante */}
      <td>
        <div style={{ fontWeight: 500, fontSize: '13px', color: 'var(--ink)' }}>
          {order.restaurant?.name || 'Local'}
        </div>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="badge badge-info text-[10px] capitalize">
            {order.restaurant?.city || 'Ciudad'}
          </span>
        </div>
      </td>

      {/* Cliente */}
      <td>
        <div style={{ fontSize: '13px', color: 'var(--ink)' }}>
          {order.client?.name || 'Cliente'}
        </div>
        <div className="text-[11px] text-gray-400 font-mono mt-0.5">
          {order.client?.phone || 'Sin teléfono'}
        </div>
      </td>

      {/* Repartidor */}
      <td>
        {order.driver ? (
          <div className="text-xs text-gray-700 font-medium">
            🛵 {order.driver.name}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Sin asignar</span>
        )}
      </td>

      {/* Total */}
      <td>
        <span className="font-mono font-bold text-sm text-gray-900">
          S/ {Number(order.total).toFixed(2)}
        </span>
      </td>

      {/* Estado */}
      <td>
        <span
          className="badge text-xs font-semibold"
          style={{ color: status.color, background: status.bg }}
        >
          {status.label}
        </span>
      </td>

      {/* Acciones */}
      <td style={{ textAlign: 'right' }}>
        <button
          type="button"
          onClick={onViewDetail}
          className="panel-btn-secondary"
          style={{ padding: '6px 12px', fontSize: '12px' }}
        >
          <Eye style={{ width: '13px', height: '13px' }} />
          <span>Ver Detalle</span>
        </button>
      </td>
    </tr>
  );
}
