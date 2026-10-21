'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { updateOrderStatus } from './actions';
import { Truck, ChefHat, Clock, CheckCircle, XCircle } from 'lucide-react';

interface OrderPaymentInfo {
  id: string;
  payment_method_code: string;
  amount: number;
  payment_status: string;
  cash_amount?: number | null;
  change_amount?: number | null;
  transaction_reference?: string | null;
}

interface Order {
  id: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  total: number;
  notes: string | null;
  deliveryAddress: string | null;
  estimated_prep_time: number | null;
  created_at: string;
  client_id: string | null;
  order_payments?: OrderPaymentInfo | null;
}

const STATUS_FLOW: Record<string, string | null> = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'picked_up',
  picked_up: 'delivered',
  delivered: null,
  cancelled: null,
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'var(--kitchen-pending)', bg: 'var(--warning-soft)', icon: <Clock className="w-4 h-4" /> },
  accepted: { label: 'Aceptado', color: 'var(--kitchen-accepted)', bg: 'var(--info-soft)', icon: <CheckCircle className="w-4 h-4" /> },
  preparing: { label: 'Preparando', color: 'var(--kitchen-preparing)', bg: 'var(--brand-soft)', icon: <ChefHat className="w-4 h-4" /> },
  ready: { label: 'Listo', color: 'var(--kitchen-ready)', bg: 'var(--success-soft)', icon: <Truck className="w-4 h-4" /> },
  picked_up: { label: 'Recogido', color: 'var(--ink-secondary)', bg: 'rgba(120,80,40,0.06)', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Entregado', color: 'var(--ink-muted)', bg: 'rgba(120,80,40,0.04)', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelado', color: 'var(--danger)', bg: 'var(--danger-soft)', icon: <XCircle className="w-4 h-4" /> },
};

interface RealtimeBoardProps {
  initialOrders: Order[];
  restaurantId: string;
}

export default function RealtimeBoard({ initialOrders, restaurantId }: RealtimeBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'preparing' | 'ready'>('pending');

  const supabase = createClient();

  useEffect(() => {
    const channel = supabase
      .channel('kitchen')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `restaurant_id=eq.${restaurantId}`,
        },
        (payload) => {
          const newOrder = payload.new as Order | null;
          const oldOrder = payload.old as Order | null;

          setOrders((prev) => {
            if (payload.eventType === 'INSERT' && newOrder) {
              return [...prev, newOrder].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            }
            if (payload.eventType === 'UPDATE' && newOrder) {
              return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
            }
            if (payload.eventType === 'DELETE' && oldOrder) {
              return prev.filter((o) => o.id !== oldOrder.id);
            }
            return prev;
          });
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, restaurantId]);

  const handleStatusUpdate = useCallback(async (orderId: string, nextStatus: string) => {
    setPendingActions((prev) => new Set(prev).add(orderId));
    const result = await updateOrderStatus(orderId, nextStatus, restaurantId);
    setPendingActions((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
    if (result.error) {
      alert(result.error);
    }
  }, [restaurantId]);

  const columns = [
    { key: 'pending', title: 'Pendiente' },
    { key: 'accepted', title: 'Aceptado' },
    { key: 'preparing', title: 'Preparando' },
    { key: 'ready', title: 'Listo' },
  ] as const;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Connection status bar - responsive */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '10px',
        gap: '12px',
        flexWrap: 'wrap',
      }}>
        <div className="flex items-center gap-2" style={{ flex: '1 1 auto', minWidth: '140px' }}>
          <span className="relative flex h-2.5 w-2.5" style={{ flexShrink: 0 }}>
            {isConnected && (
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60"
                style={{ background: 'var(--success)' }}
              />
            )}
            <span
              className="relative inline-flex rounded-full h-2.5 w-2.5"
              style={{ background: isConnected ? 'var(--success)' : 'var(--danger)' }}
            />
          </span>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--ink-secondary)' }}>
            {isConnected ? 'En vivo' : 'Sin conexión'}
          </span>
        </div>
        <span style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
          flexShrink: 0,
        }}>
          {orders.length} pedido{orders.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Mobile & Tablet: Compact segmented control */}
      <div className="lg:hidden">
        <div 
          className="grid grid-cols-4 gap-2 p-1 rounded-xl"
          style={{ 
            background: 'var(--surface-inset)',
            border: '1px solid var(--border)',
          }}
        >
          {columns.map(({ key, title }) => {
            const config = STATUS_CONFIG[key];
            const count = orders.filter((o) => o.status === key).length;
            const isActive = activeTab === key;
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  padding: '8px 4px',
                  borderRadius: '8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'var(--surface)' : 'transparent',
                  color: isActive ? config.color : 'var(--ink-muted)',
                  transition: 'all 150ms ease',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  minHeight: '56px',
                  position: 'relative',
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: isActive ? config.color : 'var(--ink-muted)',
                }}>
                  {config.icon}
                </div>
                <span style={{ 
                  fontSize: '10px', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  whiteSpace: 'nowrap',
                }}>
                  {title}
                </span>
                <span style={{
                  position: 'absolute',
                  top: '4px',
                  right: '4px',
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: '100px',
                  background: isActive ? config.color : 'var(--border)',
                  color: isActive ? '#fff' : 'var(--ink-muted)',
                  minWidth: '18px',
                  textAlign: 'center',
                  lineHeight: '16px',
                }}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile: Single column view */}
      <div className="lg:hidden">
        {(() => {
          const key = activeTab;
          const title = columns.find(c => c.key === key)?.title;
          const columnOrders = orders.filter((o) => o.status === key);
          const config = STATUS_CONFIG[key];
          const nextStatus = STATUS_FLOW[key];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {columnOrders.length === 0 ? (
                <div style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  color: 'var(--ink-muted)',
                  fontSize: '14px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px', opacity: 0.5 }}>
                    {config.icon}
                  </div>
                  <p>No hay pedidos {title?.toLowerCase()}s</p>
                </div>
              ) : (
                columnOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    config={config}
                    nextStatus={nextStatus}
                    isPending={pendingActions.has(order.id)}
                    onStatusUpdate={handleStatusUpdate}
                    isMobile={true}
                  />
                ))
              )}
            </div>
          );
        })()}
      </div>

      {/* Desktop: Kanban columns */}
      <div className="hidden lg:grid lg:grid-cols-4 gap-5">
        {columns.map(({ key, title }) => {
          const columnOrders = orders.filter((o) => o.status === key);
          const config = STATUS_CONFIG[key];
          const nextStatus = STATUS_FLOW[key];

          return (
            <div
              key={key}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                height: '600px',
                overflow: 'hidden',
              }}
            >
              {/* Column header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}>
                <div className="flex items-center gap-2" style={{ color: config.color, minWidth: 0 }}>
                  {config.icon}
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: 600, 
                    textTransform: 'uppercase', 
                    letterSpacing: '0.04em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {title}
                  </span>
                </div>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '28px',
                  height: '24px',
                  padding: '0 8px',
                  borderRadius: '100px',
                  fontSize: '13px',
                  fontWeight: 700,
                  fontVariantNumeric: 'tabular-nums',
                  background: config.bg,
                  color: config.color,
                  flexShrink: 0,
                }}>
                  {columnOrders.length}
                </span>
              </div>

              {/* Cards */}
              <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '10px' 
              }}>
                {columnOrders.length === 0 ? (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 1,
                    color: 'var(--ink-muted)',
                    fontSize: '13px',
                    padding: '20px',
                    textAlign: 'center',
                  }}>
                    Sin pedidos
                  </div>
                ) : (
                  columnOrders.map((order) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      config={config}
                      nextStatus={nextStatus}
                      isPending={pendingActions.has(order.id)}
                      onStatusUpdate={handleStatusUpdate}
                      isMobile={false}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  config,
  nextStatus,
  isPending,
  onStatusUpdate,
  isMobile = false,
}: {
  order: Order;
  config: { label: string; color: string; bg: string };
  nextStatus: string | null;
  isPending: boolean;
  onStatusUpdate: (orderId: string, nextStatus: string) => void;
  isMobile?: boolean;
}) {
  return (
    <div
      style={{
        padding: isMobile ? '16px' : '14px',
        borderRadius: '12px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: `4px solid ${config.color}`,
        opacity: isPending ? 0.55 : 1,
        transition: 'opacity 200ms ease, transform 100ms ease',
      }}
    >
      {/* Order header: ID + time + status badge */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="flex items-center gap-2 mb-1">
            <p style={{
              fontSize: isMobile ? '15px' : '13px',
              fontFamily: 'var(--font-mono)',
              color: 'var(--ink-muted)',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              #{order.id.slice(0, 8)}
            </p>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 10px',
                borderRadius: '100px',
                fontSize: '12px',
                fontWeight: 600,
                background: config.bg,
                color: config.color,
                flexShrink: 0,
              }}
            >
              {config.label}
            </span>
          </div>
          <p style={{
            fontSize: '12px',
            color: 'var(--ink-muted)',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {new Date(order.created_at).toLocaleTimeString('es-ES', { 
              hour: '2-digit', 
              minute: '2-digit',
              ...(isMobile ? {} : { second: '2-digit' })
            })}
          </p>
        </div>
      </div>

      {/* Modalidad de Entrega / Dirección */}
      {order.deliveryAddress && (
        <div style={{
          marginBottom: '8px',
          padding: '8px 10px',
          background: order.deliveryAddress.startsWith('Recojo en Tienda') ? 'rgba(242, 159, 48, 0.1)' : 'var(--surface-inset)',
          borderRadius: '8px',
          fontSize: isMobile ? '13px' : '12px',
          color: 'var(--ink-secondary)',
          lineHeight: 1.4,
        }}>
          {order.deliveryAddress.startsWith('Recojo en Tienda') ? (
            <span className="font-bold flex items-center gap-1.5" style={{ color: 'var(--brand)' }}>
              <span>🛍️</span>
              <span>Recojo en Tienda</span>
            </span>
          ) : (
            <>
              <span style={{ marginRight: '6px' }}>📍</span>
              {order.deliveryAddress}
            </>
          )}
        </div>
      )}

      {/* Información de Pago */}
      {order.order_payments && (() => {
        const payment = order.order_payments;
        const isApproved = payment.payment_status === 'approved';
        return (
          <div style={{
            marginBottom: '8px',
            padding: '8px 10px',
            background: isApproved ? 'var(--success-soft)' : 'var(--surface-inset)',
            borderRadius: '8px',
            fontSize: isMobile ? '13px' : '12px',
          }}>
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-800 capitalize">
                💳 {payment.payment_method_code}
              </span>
              <span className={`badge text-[10px] ${isApproved ? 'badge-success' : 'badge-warning'}`}>
                {isApproved ? 'Pagado' : 'Por cobrar'}
              </span>
            </div>
            {payment.payment_method_code === 'cash' && payment.change_amount && Number(payment.change_amount) > 0 && (
              <p className="text-[11px] text-gray-600 mt-1">
                Paga con S/ {Number(payment.cash_amount).toFixed(2)} · Llevar vuelto: S/ {Number(payment.change_amount).toFixed(2)}
              </p>
            )}
            {payment.transaction_reference && (
              <p className="text-[11px] font-mono text-gray-500 mt-0.5">
                Ref: {payment.transaction_reference}
              </p>
            )}
          </div>
        );
      })()}

      {/* Notes */}
      {order.notes && (
        <div style={{
          marginBottom: '10px',
          padding: '8px 10px',
          background: 'var(--warning-soft)',
          borderRadius: '8px',
          fontSize: isMobile ? '14px' : '13px',
          color: 'var(--ink-secondary)',
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          <span style={{ marginRight: '6px' }}>💬</span>
          {order.notes}
        </div>
      )}

      {/* Total + prep time */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: isMobile ? '14px' : '12px',
        color: 'var(--ink-muted)',
        marginBottom: '12px',
        fontVariantNumeric: 'tabular-nums',
        paddingTop: '8px',
        borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontWeight: 700, color: 'var(--ink)', fontSize: isMobile ? '16px' : '14px' }}>
          S/ {order.total.toFixed(2)}
        </span>
        {order.estimated_prep_time && (
          <span className="flex items-center gap-1" style={{ fontSize: isMobile ? '13px' : '12px' }}>
            <Clock className={isMobile ? "w-4 h-4" : "w-3 h-3"} />
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {order.estimated_prep_time} min
            </span>
          </span>
        )}
      </div>

      {/* Action button */}
      {nextStatus && (
        <button
          onClick={() => onStatusUpdate(order.id, nextStatus)}
          disabled={isPending}
          style={{
            width: '100%',
            padding: isMobile ? '12px 16px' : '10px 14px',
            fontSize: isMobile ? '15px' : '13px',
            fontWeight: 600,
            borderRadius: '10px',
            border: 'none',
            cursor: isPending ? 'not-allowed' : 'pointer',
            background: config.color,
            color: '#FFFFFF',
            transition: 'transform 100ms ease, opacity 150ms ease',
            minHeight: isMobile ? '48px' : 'auto',
          }}
          onMouseDown={(e) => {
            if (!isPending) (e.currentTarget.style.transform = 'scale(0.97)');
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          {isPending ? 'Procesando...' : `→ ${STATUS_CONFIG[nextStatus].label}`}
        </button>
      )}
    </div>
  );
}
