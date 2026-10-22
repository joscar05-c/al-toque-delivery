'use client';

import { useState, useMemo } from 'react';
import OrderRow from './OrderRow';
import OrderDetailModal, { OrderDetailItem } from './OrderDetailModal';
import { Search, ShoppingBag, Inbox, Clock, CheckCircle, XCircle } from 'lucide-react';

interface OrdersManagerProps {
  orders: OrderDetailItem[];
}

export default function OrdersManager({ orders }: OrdersManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusTab, setStatusTab] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');
  const [cityFilter, setCityFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderDetailItem | null>(null);

  const counts = useMemo(() => {
    return {
      total: orders.length,
      active: orders.filter((o) => ['pending', 'accepted', 'preparing', 'ready', 'picked_up'].includes(o.status)).length,
      delivered: orders.filter((o) => o.status === 'delivered').length,
      cancelled: orders.filter((o) => o.status === 'cancelled').length,
    };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Status Tab filter
      if (statusTab === 'active' && !['pending', 'accepted', 'preparing', 'ready', 'picked_up'].includes(order.status)) {
        return false;
      }
      if (statusTab === 'delivered' && order.status !== 'delivered') {
        return false;
      }
      if (statusTab === 'cancelled' && order.status !== 'cancelled') {
        return false;
      }

      // City filter
      if (cityFilter !== 'all' && order.restaurant?.city !== cityFilter) {
        return false;
      }

      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesId = order.id.toLowerCase().includes(term);
        const matchesRest = (order.restaurant?.name || '').toLowerCase().includes(term);
        const matchesClient = (order.client?.name || '').toLowerCase().includes(term);
        const matchesPhone = (order.client?.phone || '').toLowerCase().includes(term);
        return matchesId || matchesRest || matchesClient || matchesPhone;
      }

      return true;
    });
  }, [orders, statusTab, cityFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Total Pedidos
          </p>
          <p className="text-2xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.total}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-orange-600">
            En Curso / Activos
          </p>
          <p className="text-2xl font-bold mt-1 text-orange-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.active}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-green-600">
            Entregados
          </p>
          <p className="text-2xl font-bold mt-1 text-green-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.delivered}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600">
            Cancelados
          </p>
          <p className="text-2xl font-bold mt-1 text-red-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.cancelled}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-inset)', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setStatusTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusTab === 'all'
                ? 'bg-white shadow-xs text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Todos ({counts.total})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusTab === 'active'
                ? 'bg-white shadow-xs text-orange-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            En Curso ({counts.active})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('delivered')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusTab === 'delivered'
                ? 'bg-white shadow-xs text-green-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Entregados ({counts.delivered})
          </button>
          <button
            type="button"
            onClick={() => setStatusTab('cancelled')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              statusTab === 'cancelled'
                ? 'bg-white shadow-xs text-red-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Cancelados ({counts.cancelled})
          </button>
        </div>

        {/* Search & City Filter */}
        <div className="flex items-center gap-2">
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="panel-input text-xs"
            style={{ width: 'auto' }}
          >
            <option value="all">Todas las ciudades</option>
            <option value="bagua">Bagua</option>
            <option value="jaen">Jaén</option>
            <option value="chachapoyas">Chachapoyas</option>
            <option value="other">Otra ciudad</option>
          </select>

          <div className="relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar pedido #ID, cliente..."
              className="panel-input pl-9 text-xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="panel-table w-full">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Restaurante</th>
                <th>Cliente</th>
                <th>Repartidor</th>
                <th>Total</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                    <div className="flex flex-col items-center justify-center">
                      <ShoppingBag className="w-10 h-10 mb-2 opacity-40 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        {searchTerm ? 'No se encontraron pedidos con ese criterio' : 'No hay pedidos en este estado'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Los pedidos realizados desde la app móvil aparecerán aquí en tiempo real.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <OrderRow
                    key={order.id}
                    order={order}
                    onViewDetail={() => setSelectedOrder(order)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE FUERA DE LA TABLA */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}
    </div>
  );
}
