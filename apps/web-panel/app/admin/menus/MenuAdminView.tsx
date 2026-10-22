'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toggleMenuItemActive } from './actions';
import { Search, ChefHat, Store, Utensils, Inbox, AlertCircle } from 'lucide-react';

interface RestaurantOption {
  id: string;
  name: string;
  city: string | null;
}

interface MenuCategoryItem {
  id: string;
  name: string;
}

export interface MenuItemData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_active: boolean;
  restaurant_id: string | null;
  menu_category_id: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
}

interface MenuAdminViewProps {
  restaurants: RestaurantOption[];
  selectedRestaurantId: string;
  categories: MenuCategoryItem[];
  items: MenuItemData[];
}

export default function MenuAdminView({
  restaurants,
  selectedRestaurantId,
  categories,
  items,
}: MenuAdminViewProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const counts = useMemo(() => {
    return {
      total: items.length,
      active: items.filter((i) => i.is_active).length,
      paused: items.filter((i) => !i.is_active).length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (categoryFilter !== 'all' && item.menu_category_id !== categoryFilter) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = item.name.toLowerCase().includes(term);
        const matchesDesc = (item.description || '').toLowerCase().includes(term);
        return matchesName || matchesDesc;
      }
      return true;
    });
  }, [items, categoryFilter, searchTerm]);

  function handleToggleActive(itemId: string, currentStatus: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleMenuItemActive(itemId, currentStatus);
      if (result.error) setError(result.error);
    });
  }

  function handleSelectRestaurant(newRestId: string) {
    router.push(`/admin/menus?restaurantId=${newRestId}`);
  }

  return (
    <div className="space-y-6">
      {/* Restaurant Selector Bar */}
      <div className="section-card p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Store style={{ width: '18px', height: '18px', color: 'var(--brand)' }} />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Selecciona Restaurante a Auditar:
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <select
            value={selectedRestaurantId}
            onChange={(e) => handleSelectRestaurant(e.target.value)}
            className="panel-input font-medium text-sm sm:max-w-xs"
          >
            {restaurants.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {r.city ? `(${r.city})` : ''}
              </option>
            ))}
          </select>

          {selectedRestaurantId && (
            <Link
              href={`/restaurant/menu?restaurantId=${selectedRestaurantId}`}
              className="panel-btn-primary text-xs whitespace-nowrap"
              style={{ padding: '8px 14px', textDecoration: 'none' }}
              title="Crear platos, categorías, fotos y extras para este restaurante"
            >
              <Utensils style={{ width: '13px', height: '13px' }} />
              <span>Gestionar Carta y Extras</span>
            </Link>
          )}
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Total Platos / Ítems
          </p>
          <p className="text-2xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.total}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-green-600">
            Disponibles
          </p>
          <p className="text-2xl font-bold mt-1 text-green-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.active}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Pausados
          </p>
          <p className="text-2xl font-bold mt-1 text-gray-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.paused}
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar plato o producto..."
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

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="panel-input text-xs"
          style={{ width: 'auto' }}
        >
          <option value="all">Todas las secciones de carta</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table Card */}
      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="panel-table w-full">
            <thead>
              <tr>
                <th>Producto / Plato</th>
                <th>Sección</th>
                <th>Precio</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                    <div className="flex flex-col items-center justify-center">
                      <ChefHat className="w-10 h-10 mb-2 opacity-40 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        {searchTerm ? 'No se encontraron platos con ese criterio' : 'Este restaurante no tiene productos en la carta'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className={isPending ? 'opacity-50' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-gray-50 border"
                          style={{ borderColor: 'var(--border)' }}
                        >
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ChefHat style={{ width: '16px', height: '16px', color: 'var(--ink-muted)' }} />
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '13px' }}>
                            {item.name}
                          </div>
                          {item.description && (
                            <div className="text-[11px] text-gray-400 truncate max-w-[260px]">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="badge badge-info text-[11px]">
                        {item.category?.name || 'General'}
                      </span>
                    </td>

                    <td>
                      <span className="font-mono font-bold text-sm text-gray-900">
                        S/ {Number(item.price).toFixed(2)}
                      </span>
                    </td>

                    <td>
                      <span className={`badge ${item.is_active ? 'badge-success' : 'badge-neutral'}`}>
                        {item.is_active ? '● Disponible' : '○ Pausado'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleActive(item.id, item.is_active)}
                        disabled={isPending}
                        className={`panel-btn-secondary ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                        style={{
                          padding: '6px 12px',
                          fontSize: '12px',
                          color: item.is_active ? 'var(--danger)' : 'var(--success)',
                          borderColor: item.is_active ? 'var(--danger-soft)' : 'var(--success-soft)',
                        }}
                      >
                        {item.is_active ? 'Pausar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg text-xs flex items-center gap-2 bg-red-50 text-red-600">
          <AlertCircle style={{ width: '14px', height: '14px' }} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
