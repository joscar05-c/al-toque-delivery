'use client';

import { useState, useMemo } from 'react';
import RestaurantRow from './RestaurantRow';
import RestaurantEditModal, { RestaurantItem } from './RestaurantEditModal';
import RestaurantCreateForm from './RestaurantCreateForm';
import { Search, Plus, Store, Filter, CheckCircle, Star, X } from 'lucide-react';

interface OwnerOption {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role_id: number | null;
}

interface CategoryOption {
  id: string;
  name: string;
}

interface CityOption {
  value: string;
  label: string;
}

interface RestaurantsManagerProps {
  restaurants: RestaurantItem[];
  owners: OwnerOption[];
  categories: CategoryOption[];
  cities: readonly CityOption[];
}

export default function RestaurantsManager({
  restaurants,
  owners,
  categories,
  cities,
}: RestaurantsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'partner'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRestaurant, setEditingRestaurant] = useState<RestaurantItem | null>(null);

  // Counters
  const counts = useMemo(() => {
    return {
      total: restaurants.length,
      active: restaurants.filter((r) => r.is_active).length,
      inactive: restaurants.filter((r) => !r.is_active).length,
      partners: restaurants.filter((r) => r.is_partner).length,
    };
  }, [restaurants]);

  // Filtered list
  const filteredRestaurants = useMemo(() => {
    return restaurants.filter((r) => {
      // City
      if (cityFilter !== 'all' && r.city !== cityFilter) return false;

      // Status
      if (statusFilter === 'active' && !r.is_active) return false;
      if (statusFilter === 'inactive' && r.is_active) return false;
      if (statusFilter === 'partner' && !r.is_partner) return false;

      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = r.name.toLowerCase().includes(term);
        const matchesOwner = (r.owner?.name || '').toLowerCase().includes(term);
        const matchesPhone = r.phone.toLowerCase().includes(term);
        const matchesAddress = r.address.toLowerCase().includes(term);
        return matchesName || matchesOwner || matchesPhone || matchesAddress;
      }

      return true;
    });
  }, [restaurants, cityFilter, statusFilter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Total Locales
          </p>
          <p className="text-2xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.total}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-green-600">
            Activos
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
            {counts.inactive}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
            Partners
          </p>
          <p className="text-2xl font-bold mt-1 text-amber-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.partners}
          </p>
        </div>
      </div>

      {/* Action Bar: Search, Filters & New Restaurant */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por restaurante, propietario, teléfono..."
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

        {/* Filters and CTA */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="panel-input text-xs"
            style={{ width: 'auto' }}
          >
            <option value="all">Todos los estados</option>
            <option value="active">Solo Activos</option>
            <option value="inactive">Solo Pausados</option>
            <option value="partner">Solo Partners</option>
          </select>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="panel-input text-xs"
            style={{ width: 'auto' }}
          >
            <option value="all">Todas las ciudades</option>
            {cities.map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>

          {/* New Restaurant Button */}
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="panel-btn-primary"
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Plus style={{ width: '16px', height: '16px' }} />
            <span>Nuevo Restaurante</span>
          </button>
        </div>
      </div>

      {/* Restaurants Table Card */}
      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="panel-table w-full">
            <thead>
              <tr>
                <th>Restaurante</th>
                <th>Propietario</th>
                <th>Ubicación</th>
                <th>Rendimiento</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRestaurants.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                    <div className="flex flex-col items-center justify-center">
                      <Store className="w-10 h-10 mb-2 opacity-40 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        {searchTerm ? 'No se encontraron restaurantes con esos criterios' : 'No hay restaurantes registrados'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Puedes dar de alta un restaurante usando el botón &quot;Nuevo Restaurante&quot;
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRestaurants.map((restaurant) => (
                  <RestaurantRow
                    key={restaurant.id}
                    restaurant={restaurant}
                    onEdit={() => setEditingRestaurant(restaurant)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL EDITAR RESTAURANTE */}
      {editingRestaurant && (
        <RestaurantEditModal
          restaurant={editingRestaurant}
          owners={owners}
          categories={categories}
          cities={cities}
          onClose={() => setEditingRestaurant(null)}
        />
      )}

      {/* MODAL CREAR RESTAURANTE */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="section-card w-full max-w-2xl p-6 bg-white shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  Dar de Alta Nuevo Restaurante
                </h3>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  Asigna el restaurante a un cliente/propietario o créalo sin asignar para vincularlo después.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {owners.length === 0 && (
              <div
                className="p-3 rounded-lg mb-4 text-xs"
                style={{
                  background: 'var(--warning-soft)',
                  color: '#92400E',
                  border: '1px solid rgba(217, 119, 6, 0.2)',
                }}
              >
                Aviso: No hay usuarios registrados actualmente en la lista. Puedes dar de alta el restaurante sin propietario y vincularlo más adelante cuando el usuario inicie sesión en la app.
              </div>
            )}

            <RestaurantCreateForm
              owners={owners}
              categories={categories}
              cities={cities}
              onSuccess={() => {
                setTimeout(() => setShowCreateModal(false), 1200);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
