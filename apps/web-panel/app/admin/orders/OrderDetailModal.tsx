'use client';

import { useState, useTransition } from 'react';
import { cancelOrder, updateOrderStatus } from './actions';
import { X, ShoppingBag, Store, User, Truck, AlertCircle, ExternalLink } from 'lucide-react';

export interface OrderDetailItem {
  id: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  total: number;
  notes: string | null;
  deliveryAddress: string | null;
  created_at: string;
  updated_at: string;
  client_id: string | null;
  driver_id: string | null;
  restaurant_id: string | null;
  restaurant?: {
    id: string;
    name: string;
    city: string;
    phone: string;
    address: string;
  } | null;
  client?: {
    id: string;
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  driver?: {
    id: string;
    name: string | null;
    phone: string | null;
  } | null;
  order_payments?: Array<{
    id: string;
    payment_method_code: string;
    amount: number;
    payment_status: string;
    payment_proof_url: string | null;
    transaction_reference: string | null;
    cash_amount?: number | null;
    change_amount?: number | null;
  }> | null;
  order_items?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    comment: string | null;
    options: any;
    menu_items?: {
      name: string;
    } | null;
  }> | null;
}

interface OrderDetailModalProps {
  order: OrderDetailItem;
  onClose: () => void;
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

export default function OrderDetailModal({ order, onClose }: OrderDetailModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const statusConfig = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
  const payment = order.order_payments?.[0];

  function handleCancelSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cancelReason.trim()) {
      setError('Debes ingresar un motivo de cancelación.');
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await cancelOrder(order.id, cancelReason);
      if (result.error) {
        setError(result.error);
      } else {
        setShowCancelPrompt(false);
        onClose();
      }
    });
  }

  function handleStatusChange(newStatus: string) {
    if (!confirm(`¿Actualizar estado del pedido a "${STATUS_LABELS[newStatus]?.label || newStatus}"?`)) return;

    setError(null);
    startTransition(async () => {
      const result = await updateOrderStatus(order.id, newStatus);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="section-card w-full max-w-2xl p-6 bg-white shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
            >
              <ShoppingBag style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-gray-900">
                  Pedido #{order.id.slice(0, 8)}
                </h3>
                <span
                  className="badge font-semibold text-xs"
                  style={{ color: statusConfig.color, background: statusConfig.bg }}
                >
                  {statusConfig.label}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(order.created_at).toLocaleString()}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Details Content */}
        <div className="space-y-4">
          {/* Actors Grid: Restaurant, Client, Driver */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Restaurant */}
            <div className="p-3 rounded-lg border bg-gray-50/50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                <Store style={{ width: '13px', height: '13px', color: 'var(--brand)' }} />
                <span>Restaurante</span>
              </div>
              <p className="font-semibold text-sm text-gray-900 truncate">
                {order.restaurant?.name || 'Local'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{order.restaurant?.phone || 'Sin teléfono'}</p>
              <p className="text-[11px] text-gray-400 truncate mt-0.5" title={order.restaurant?.address}>
                {order.restaurant?.address || ''}
              </p>
            </div>

            {/* Client */}
            <div className="p-3 rounded-lg border bg-gray-50/50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                <User style={{ width: '13px', height: '13px', color: '#2563EB' }} />
                <span>Cliente</span>
              </div>
              <p className="font-semibold text-sm text-gray-900 truncate">
                {order.client?.name || 'Cliente'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{order.client?.phone || 'Sin teléfono'}</p>
              {order.deliveryAddress?.startsWith('Recojo en Tienda') ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md mt-1">
                  🛍️ Recojo en Tienda
                </span>
              ) : (
                <p className="text-[11px] text-gray-400 truncate mt-0.5" title={order.deliveryAddress || ''}>
                  📍 {order.deliveryAddress || 'Sin dirección'}
                </p>
              )}
            </div>

            {/* Driver */}
            <div className="p-3 rounded-lg border bg-gray-50/50">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-1">
                <Truck style={{ width: '13px', height: '13px', color: '#059669' }} />
                <span>Repartidor</span>
              </div>
              {order.driver ? (
                <>
                  <p className="font-semibold text-sm text-gray-900 truncate">{order.driver.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{order.driver.phone || 'Sin teléfono'}</p>
                </>
              ) : (
                <p className="text-xs text-gray-400 mt-1 italic">Sin repartidor asignado</p>
              )}
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 border-b">
              Productos ({order.order_items?.length || 0})
            </div>
            <div className="divide-y divide-gray-100 max-h-[220px] overflow-y-auto">
              {order.order_items?.map((item) => (
                <div key={item.id} className="p-3 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-semibold text-gray-900">
                      {item.quantity}x {item.menu_items?.name || 'Producto'}
                    </span>
                    {item.comment && (
                      <p className="text-[11px] text-gray-400 italic mt-0.5">
                        Nota: {item.comment}
                      </p>
                    )}
                  </div>
                  <span className="font-mono font-medium text-gray-800">
                    S/ {(Number(item.quantity) * Number(item.unit_price)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Total Footer */}
            <div className="bg-gray-50/80 p-3 border-t flex items-center justify-between text-sm">
              <span className="font-semibold text-gray-700">Total a Pagar</span>
              <span className="font-bold text-base text-gray-900 font-mono">
                S/ {Number(order.total).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Payment & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {payment && (
              <div className="p-3 rounded-lg border bg-gray-50">
                <span className="font-bold text-gray-700 block mb-1">Método de Pago</span>
                <div className="flex items-center justify-between">
                  <span className="capitalize font-semibold text-gray-800">{payment.payment_method_code}</span>
                  <span className={`badge ${payment.payment_status === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                    {payment.payment_status}
                  </span>
                </div>
                {payment.payment_method_code === 'cash' && payment.change_amount && Number(payment.change_amount) > 0 && (
                  <p className="text-[11px] text-gray-600 mt-1 font-mono">
                    Paga con S/ {Number(payment.cash_amount).toFixed(2)} (Vuelto: S/ {Number(payment.change_amount).toFixed(2)})
                  </p>
                )}
                {payment.transaction_reference && (
                  <p className="text-[11px] font-mono text-gray-500 mt-1">
                    Ref: {payment.transaction_reference}
                  </p>
                )}
                {payment.payment_proof_url && (
                  <a
                    href={payment.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-1.5"
                  >
                    <span>Ver Comprobante</span>
                    <ExternalLink style={{ width: '11px', height: '11px' }} />
                  </a>
                )}
              </div>
            )}

            {order.notes && (
              <div className="p-3 rounded-lg border bg-gray-50">
                <span className="font-bold text-gray-700 block mb-1">Notas del Pedido</span>
                <p className="text-gray-600 line-clamp-3">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Quick status change buttons */}
          <div className="pt-2 border-t flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-500">Forzar estado:</span>
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={isPending || order.status === 'cancelled' || order.status === 'delivered'}
                className="panel-input text-xs py-1"
                style={{ width: 'auto' }}
              >
                {Object.keys(STATUS_LABELS).map((st) => (
                  <option key={st} value={st}>
                    {STATUS_LABELS[st].label}
                  </option>
                ))}
              </select>
            </div>

            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <button
                type="button"
                onClick={() => setShowCancelPrompt(true)}
                disabled={isPending}
                className="panel-btn-secondary"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger-soft)', fontSize: '12px' }}
              >
                Cancelar Pedido
              </button>
            )}
          </div>

          {/* Cancel prompt */}
          {showCancelPrompt && (
            <form onSubmit={handleCancelSubmit} className="p-3 bg-red-50 border border-red-200 rounded-lg space-y-2">
              <p className="text-xs font-bold text-red-700">
                Confirmar cancelación de pedido:
              </p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Indica el motivo (ej: Local sin stock, cliente no responde, fuera de horario)..."
                rows={2}
                required
                className="panel-input text-xs"
                disabled={isPending}
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(false)}
                  className="panel-btn-secondary text-xs"
                >
                  Regresar
                </button>
                <button
                  type="submit"
                  disabled={isPending || !cancelReason.trim()}
                  className="panel-btn-primary text-xs"
                  style={{ background: 'var(--danger)' }}
                >
                  {isPending ? 'Cancelando...' : 'Confirmar Cancelación'}
                </button>
              </div>
            </form>
          )}

          {error && (
            <div className="text-xs p-2.5 rounded-md flex items-center gap-1.5 text-red-600 bg-red-50">
              <AlertCircle style={{ width: '14px', height: '14px' }} />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
