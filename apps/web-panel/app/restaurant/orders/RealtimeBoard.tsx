'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { updateOrderStatus } from './actions';
import { Truck, ChefHat, Clock, CheckCircle, XCircle } from 'lucide-react';

interface Order {
  id: string;
  status: 'pending' | 'accepted' | 'preparing' | 'ready' | 'picked_up' | 'delivered' | 'cancelled';
  total: number;
  notes: string | null;
  deliveryAddress: string | null;
  estimated_prep_time: number | null;
  created_at: string;
  client_id: string | null;
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

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="w-4 h-4" /> },
  accepted: { label: 'Aceptado', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <CheckCircle className="w-4 h-4" /> },
  preparing: { label: 'Preparando', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: <ChefHat className="w-4 h-4" /> },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-800 border-green-200', icon: <Truck className="w-4 h-4" /> },
  picked_up: { label: 'Recogido', color: 'bg-purple-100 text-purple-800', icon: <Truck className="w-4 h-4" /> },
  delivered: { label: 'Entregado', color: 'bg-gray-100 text-gray-800', icon: <CheckCircle className="w-4 h-4" /> },
  cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: <XCircle className="w-4 h-4" /> },
};

interface RealtimeBoardProps {
  initialOrders: Order[];
  restaurantId: string;
}

export default function RealtimeBoard({ initialOrders, restaurantId }: RealtimeBoardProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingActions, setPendingActions] = useState<Set<string>>(new Set());

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
    const result = await updateOrderStatus(orderId, nextStatus);
    setPendingActions((prev) => {
      const next = new Set(prev);
      next.delete(orderId);
      return next;
    });
    if (result.error) {
      alert(result.error);
    }
  }, []);

  const columns = [
    { key: 'pending', title: 'Pendiente' },
    { key: 'accepted', title: 'Aceptado' },
    { key: 'preparing', title: 'Preparando' },
    { key: 'ready', title: 'Listo' },
  ] as const;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">{isConnected ? 'Conectado (tiempo real)' : 'Desconectado'}</span>
        </div>
        <span className="text-sm text-gray-500">{orders.length} pedidos activos</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {columns.map(({ key, title }) => {
          const columnOrders = orders.filter((o) => o.status === key);
          const config = STATUS_CONFIG[key];
          const nextStatus = STATUS_FLOW[key];

          return (
            <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col h-[600px]">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                  {config.icon}
                  {title}
                </h3>
                <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                  {columnOrders.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {columnOrders.length === 0 ? (
                  <div className="text-center text-gray-400 py-8 text-sm">Sin pedidos</div>
                ) : (
                  columnOrders.map((order) => {
                    const isPending = pendingActions.has(order.id);
                    return (
                      <div key={order.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 transition-opacity" style={{ opacity: isPending ? 0.6 : 1 }}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono text-gray-500 truncate">#{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-gray-400">
                              {new Date(order.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                            {config.icon}
                          </span>
                        </div>

                        {order.deliveryAddress && (
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1 truncate">
                            {order.deliveryAddress}
                          </p>
                        )}

                        {order.notes && (
                          <p className="text-sm text-gray-500 mb-2 italic line-clamp-1">
                            {order.notes}
                          </p>
                        )}

                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span>Total: S/ {order.total.toFixed(2)}</span>
                          {order.estimated_prep_time && (
                            <span><Clock className="w-3 h-3 inline mr-1" /> {order.estimated_prep_time} min</span>
                          )}
                        </div>

                        {nextStatus && (
                          <button
                            onClick={() => handleStatusUpdate(order.id, nextStatus)}
                            disabled={isPending}
                            className="w-full py-2 px-3 text-sm font-medium rounded-lg transition-colors bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isPending ? 'Procesando...' : `→ ${STATUS_CONFIG[nextStatus].label}`}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}