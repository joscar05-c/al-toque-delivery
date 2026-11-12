'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import {
  assignRestaurantOrderDriver,
  autoAssignRestaurantOrder,
  updateOrderStatus,
} from './actions';
import {
  Truck,
  ChefHat,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  User,
  Volume2,
  VolumeX,
  BellRing,
} from 'lucide-react';

/**
 * Reproduce un timbre de cocina de 3 notas usando Web Audio API (sin dependencias externas).
 */
function playKitchenChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const notes = [880, 1174.66, 1318.51, 1760]; // A5, D6, E6, A6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.14);

      gain.gain.setValueAtTime(0.0001, ctx.currentTime + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.28, ctx.currentTime + idx * 0.14 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.14 + 0.36);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.14);
      osc.stop(ctx.currentTime + idx * 0.14 + 0.38);
    });

    setTimeout(() => {
      void ctx.close().catch(() => {});
    }, 1500);
  } catch {
    // Ignorar si el navegador bloquea autoplay antes de interacción del usuario
  }
}

interface OrderPaymentInfo {
  id: string;
  payment_method_code: string;
  amount: number;
  payment_status: string;
  cash_amount?: number | null;
  change_amount?: number | null;
  transaction_reference?: string | null;
}

export interface FleetDriverOption {
  id: string;
  name: string;
  phone: string | null;
  activeOrdersCount: number;
}

interface Order {
  id: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  total: number;
  notes: string | null;
  deliveryAddress: string | null;
  fulfillment_type: 'delivery' | 'pickup';
  driver_id: string | null;
  driver?: { id: string; name: string | null; phone: string | null } | null;
  estimated_prep_time: number | null;
  created_at: string;
  updated_at?: string;
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
  picked_up: { label: 'En Camino', color: '#7C3AED', bg: 'rgba(124, 58, 237, 0.1)', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Entregado', color: 'var(--ink-muted)', bg: 'rgba(120,80,40,0.04)', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelado', color: 'var(--danger)', bg: 'var(--danger-soft)', icon: <XCircle className="w-4 h-4" /> },
};

interface RealtimeBoardProps {
  initialOrders: Order[];
  restaurantId: string;
  deliveryType: 'platform' | 'restaurant_own' | 'pickup_only';
  fleetDrivers: FleetDriverOption[];
}

export default function RealtimeBoard({
  initialOrders,
  restaurantId,
  deliveryType,
  fleetDrivers,
}: RealtimeBoardProps) {
  const router = useRouter();
  const [realtimePatches, setRealtimePatches] = useState<Map<string, Order>>(new Map());
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [isConnected, setIsConnected] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'preparing' | 'ready' | 'picked_up'>('pending');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('al_toque_kitchen_sound') !== 'off';
  });
  const [newOrderAlert, setNewOrderAlert] = useState<{
    id: string;
    total: number;
    fulfillmentType: 'delivery' | 'pickup';
  } | null>(null);

  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const knownOrderIdsRef = useRef<Set<string>>(
    new Set(initialOrders.map((o) => o.id)),
  );
  useEffect(() => {
    for (const o of initialOrders) {
      knownOrderIdsRef.current.add(o.id);
    }
  }, [initialOrders]);

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('al_toque_kitchen_sound', next ? 'on' : 'off');
    }
    if (next) {
      playKitchenChime();
    }
  };

  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel(`kitchen-${restaurantId}`)
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

          if (payload.eventType === 'DELETE' && oldOrder) {
            setDeletedIds((prev) => new Set(prev).add(oldOrder.id));
            router.refresh();
            return;
          }

          if (newOrder) {
            const isBrandNewPending =
              (payload.eventType === 'INSERT' || !knownOrderIdsRef.current.has(newOrder.id)) &&
              newOrder.status === 'pending';

            knownOrderIdsRef.current.add(newOrder.id);

            if (isBrandNewPending) {
              setNewOrderAlert({
                id: newOrder.id,
                total: Number(newOrder.total ?? 0),
                fulfillmentType:
                  newOrder.fulfillment_type === 'pickup' ? 'pickup' : 'delivery',
              });
              if (soundEnabledRef.current) {
                playKitchenChime();
              }
            }

            if (['delivered', 'cancelled'].includes(newOrder.status)) {
              setDeletedIds((prev) => new Set(prev).add(newOrder.id));
            } else {
              setRealtimePatches((prev) => {
                const next = new Map(prev);
                next.set(newOrder.id, newOrder);
                return next;
              });
            }
            router.refresh();
          }
        },
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, restaurantId, router]);

  const orders = useMemo(() => {
    const byId = new Map<string, Order>();

    for (const o of initialOrders) {
      if (!deletedIds.has(o.id)) {
        byId.set(o.id, o);
      }
    }

    for (const [id, patch] of realtimePatches.entries()) {
      if (deletedIds.has(id) || ['delivered', 'cancelled'].includes(patch.status)) {
        byId.delete(id);
        continue;
      }

      const base = byId.get(id);
      if (base) {
        const baseTs = base.updated_at ? new Date(base.updated_at).getTime() : 0;
        const patchTs = patch.updated_at ? new Date(patch.updated_at).getTime() : 0;
        if (patchTs >= baseTs) {
          byId.set(id, {
            ...base,
            ...patch,
            driver:
              patch.driver_id === base.driver_id
                ? base.driver
                : patch.driver_id
                  ? fleetDrivers.find((d) => d.id === patch.driver_id) ?? base.driver ?? null
                  : null,
            order_payments: base.order_payments ?? patch.order_payments ?? null,
          });
        }
      } else {
        byId.set(id, {
          ...patch,
          fulfillment_type: patch.fulfillment_type === 'pickup' ? 'pickup' : 'delivery',
          driver: patch.driver_id
            ? fleetDrivers.find((d) => d.id === patch.driver_id) ?? null
            : null,
        });
      }
    }

    return Array.from(byId.values()).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
  }, [initialOrders, realtimePatches, deletedIds, fleetDrivers]);

  const runOrderAction = useCallback(
    async (orderId: string, action: () => Promise<{ error?: string; success?: boolean }>) => {
      setPendingActions((prev) => new Set(prev).add(orderId));
      const result = await action();
      setPendingActions((prev) => {
        const next = new Set(prev);
        next.delete(orderId);
        return next;
      });
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    },
    [router],
  );

  const handleStatusUpdate = useCallback(
    async (orderId: string, nextStatus: string) => {
      await runOrderAction(orderId, () => updateOrderStatus(orderId, nextStatus, restaurantId));
    },
    [restaurantId, runOrderAction],
  );

  const handleAssignDriver = useCallback(
    async (orderId: string, driverId: string | null) => {
      await runOrderAction(orderId, () =>
        assignRestaurantOrderDriver(orderId, driverId, restaurantId),
      );
    },
    [restaurantId, runOrderAction],
  );

  const handleAutoAssign = useCallback(
    async (orderId: string) => {
      await runOrderAction(orderId, () => autoAssignRestaurantOrder(orderId, restaurantId));
    },
    [restaurantId, runOrderAction],
  );

  const columns = [
    { key: 'pending', title: 'Pendiente' },
    { key: 'accepted', title: 'Aceptado' },
    { key: 'preparing', title: 'Preparando' },
    { key: 'ready', title: 'Listo' },
    { key: 'picked_up', title: 'En Camino' },
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
        <div className="flex items-center gap-3 flex-wrap">
          <button
            type="button"
            onClick={handleToggleSound}
            title={
              soundEnabled
                ? 'Alerta sonora activada (clic para silenciar)'
                : 'Alerta sonora silenciada (clic para activar y probar)'
            }
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                Sonido activo
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                Silenciado
              </>
            )}
          </button>

          <span
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
              deliveryType === 'restaurant_own'
                ? 'bg-amber-100 text-amber-800'
                : deliveryType === 'platform'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-100 text-slate-700'
            }`}
          >
            {deliveryType === 'restaurant_own'
              ? `🛵 Flota Propia (${fleetDrivers.length} activo${fleetDrivers.length === 1 ? '' : 's'})`
              : deliveryType === 'platform'
                ? '⚡ Red Al Toque (Plataforma)'
                : '🏬 Solo Recojo'}
          </span>
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
      </div>

      {/* Banner visual y sonoro de nuevo pedido entrante */}
      {newOrderAlert && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 shadow-sm"
          role="alert"
        >
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
              <BellRing className="h-4 w-4 animate-bounce" />
            </span>
            <div>
              <p className="text-sm font-bold text-amber-950">
                ¡Nuevo pedido recibido! #{newOrderAlert.id.slice(0, 8).toUpperCase()}
              </p>
              <p className="text-xs font-medium text-amber-800">
                {newOrderAlert.fulfillmentType === 'pickup'
                  ? '🏬 Recojo en tienda'
                  : '🛵 Entrega a domicilio'}{' '}
                · Total S/ {newOrderAlert.total.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setActiveTab('pending');
                setNewOrderAlert(null);
              }}
              className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-700 transition-colors cursor-pointer"
            >
              Ver en Pendientes
            </button>
            <button
              type="button"
              onClick={() => setNewOrderAlert(null)}
              className="rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Mobile & Tablet: Compact segmented control */}
      <div className="lg:hidden">
        <div
          className="grid grid-cols-5 gap-1.5 p-1 rounded-xl"
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
                    deliveryType={deliveryType}
                    fleetDrivers={fleetDrivers}
                    isPending={pendingActions.has(order.id)}
                    onStatusUpdate={handleStatusUpdate}
                    onAssignDriver={handleAssignDriver}
                    onAutoAssign={handleAutoAssign}
                    isMobile={true}
                  />
                ))
              )}
            </div>
          );
        })()}
      </div>

      {/* Desktop: Kanban columns */}
      <div className="hidden lg:grid lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
                      deliveryType={deliveryType}
                      fleetDrivers={fleetDrivers}
                      isPending={pendingActions.has(order.id)}
                      onStatusUpdate={handleStatusUpdate}
                      onAssignDriver={handleAssignDriver}
                      onAutoAssign={handleAutoAssign}
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
  deliveryType,
  fleetDrivers,
  isPending,
  onStatusUpdate,
  onAssignDriver,
  onAutoAssign,
  isMobile = false,
}: {
  order: Order;
  config: { label: string; color: string; bg: string };
  nextStatus: string | null;
  deliveryType: 'platform' | 'restaurant_own' | 'pickup_only';
  fleetDrivers: FleetDriverOption[];
  isPending: boolean;
  onStatusUpdate: (orderId: string, nextStatus: string) => void;
  onAssignDriver: (orderId: string, driverId: string | null) => void;
  onAutoAssign: (orderId: string) => void;
  isMobile?: boolean;
}) {
  const isPickupOrder =
    order.fulfillment_type === 'pickup' ||
    Boolean(order.deliveryAddress?.startsWith('Recojo en Tienda'));
  const effectiveNextStatus =
    isPickupOrder && order.status === 'ready' ? 'delivered' : nextStatus;
  const nextStatusLabel =
    isPickupOrder && order.status === 'ready'
      ? '→ Entregado en Tienda'
      : effectiveNextStatus
        ? `→ ${STATUS_CONFIG[effectiveNextStatus].label}`
        : null;
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

      {/* Repartidor asignado / despacho (solo para pedidos delivery) */}
      {!isPickupOrder && (
        <div
          style={{
            marginBottom: '8px',
            padding: '8px 10px',
            borderRadius: '8px',
            background: order.driver ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: order.driver
              ? '1px solid rgba(16, 185, 129, 0.25)'
              : '1px solid rgba(245, 158, 11, 0.25)',
            fontSize: '12px',
          }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="font-semibold text-gray-800 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              {order.driver ? (
                <span>🛵 {order.driver.name || 'Repartidor asignado'}</span>
              ) : (
                <span className="text-amber-800">Sin repartidor asignado</span>
              )}
            </span>
            {order.driver?.phone && (
              <span className="text-[11px] font-mono text-gray-500">
                {order.driver.phone}
              </span>
            )}
          </div>

          {deliveryType === 'restaurant_own' && (
            <div className="mt-2 flex flex-col gap-1.5">
              {fleetDrivers.length > 0 ? (
                <div className="flex items-center gap-1.5">
                  <select
                    value={order.driver_id ?? ''}
                    onChange={(e) => onAssignDriver(order.id, e.target.value || null)}
                    disabled={isPending}
                    className="panel-input text-[11px] py-1 flex-1"
                  >
                    <option value="">-- Seleccionar motorizado --</option>
                    {fleetDrivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.activeOrdersCount} en curso)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => onAutoAssign(order.id)}
                    disabled={isPending}
                    title="Asignar automáticamente al repartidor con menos pedidos (0 primero)"
                    className="panel-btn-secondary text-[11px] px-2 py-1 whitespace-nowrap"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Auto</span>
                  </button>
                </div>
              ) : (
                <p className="text-[11px] text-amber-800">
                  No tienes repartidores propios vinculados en Configuración.
                </p>
              )}
            </div>
          )}

          {deliveryType === 'platform' && !order.driver_id && (
            <p className="text-[11px] text-amber-800 mt-1">
              Disponible para que un repartidor de Red Al Toque lo tome en su app.
            </p>
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
      {effectiveNextStatus && nextStatusLabel && (
        <button
          onClick={() => onStatusUpdate(order.id, effectiveNextStatus)}
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
          {isPending ? 'Procesando...' : nextStatusLabel}
        </button>
      )}
    </div>
  );
}
