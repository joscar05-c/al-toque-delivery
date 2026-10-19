'use client';

import { useState, useTransition } from 'react';
import { updateRestaurant } from './actions';
import { X, Store, AlertCircle } from 'lucide-react';

interface CategoryOption {
  id: string;
  name: string;
}

interface CityOption {
  value: string;
  label: string;
}

export interface RestaurantItem {
  id: string;
  name: string;
  address: string;
  phone: string;
  city: string;
  image_url: string | null;
  average_prep_time: number;
  is_active: boolean;
  rating: number | null;
  total_reviews: number | null;
  is_partner: boolean | null;
  sales_count: number | null;
  created_at: string;
  owner_id: string;
  restaurant_category_id: string | null;
  category?: { id: string; name: string } | null;
  owner?: { id: string; name: string | null; phone: string | null; email: string | null } | null;
}

interface RestaurantEditModalProps {
  restaurant: RestaurantItem;
  categories: CategoryOption[];
  cities: readonly CityOption[];
  onClose: () => void;
}

export default function RestaurantEditModal({
  restaurant,
  categories,
  cities,
  onClose,
}: RestaurantEditModalProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateRestaurant(restaurant.id, formData);
      if (result.error) {
        setError(result.error);
      } else {
        onClose();
      }
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className="section-card w-full max-w-xl p-6 bg-white shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}
            >
              <Store style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                Editar Restaurante
              </h3>
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                Propietario: {restaurant.owner?.name || restaurant.owner?.phone || 'Sin asignar'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="edit-name" className="panel-label">
                Nombre del restaurante
              </label>
              <input
                id="edit-name"
                name="name"
                defaultValue={restaurant.name}
                className="panel-input"
                required
                disabled={isPending}
              />
            </div>

            <div>
              <label htmlFor="edit-phone" className="panel-label">
                Teléfono de contacto
              </label>
              <input
                id="edit-phone"
                name="phone"
                type="tel"
                defaultValue={restaurant.phone}
                className="panel-input"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-address" className="panel-label">
              Dirección
            </label>
            <input
              id="edit-address"
              name="address"
              defaultValue={restaurant.address}
              className="panel-input"
              required
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label htmlFor="edit-city" className="panel-label">
                Ciudad
              </label>
              <select
                id="edit-city"
                name="city"
                defaultValue={restaurant.city}
                className="panel-input"
                required
                disabled={isPending}
              >
                {cities.map((city) => (
                  <option key={city.value} value={city.value}>
                    {city.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-categoryId" className="panel-label">
                Categoría
              </label>
              <select
                id="edit-categoryId"
                name="categoryId"
                defaultValue={restaurant.restaurant_category_id || ''}
                className="panel-input"
                disabled={isPending}
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="edit-averagePrepTime" className="panel-label">
                Prep. promedio (min)
              </label>
              <input
                id="edit-averagePrepTime"
                name="averagePrepTime"
                type="number"
                min={1}
                step={1}
                defaultValue={restaurant.average_prep_time || 30}
                className="panel-input"
                required
                disabled={isPending}
              />
            </div>
          </div>

          <div>
            <label htmlFor="edit-imageUrl" className="panel-label">
              URL de Foto / Logo (opcional)
            </label>
            <input
              id="edit-imageUrl"
              name="imageUrl"
              type="url"
              placeholder="https://ejemplo.com/imagen.jpg"
              defaultValue={restaurant.image_url || ''}
              className="panel-input text-xs"
              disabled={isPending}
            />
            {restaurant.image_url && (
              <p className="text-[11px] mt-1 text-gray-400">
                URL actual guardada en el sistema.
              </p>
            )}
          </div>

          {error && (
            <div
              className="text-xs p-3 rounded-md flex items-center gap-2"
              style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
            >
              <AlertCircle style={{ width: '16px', height: '16px', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div className="pt-4 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="panel-btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="panel-btn-primary"
            >
              {isPending ? 'Guardando cambios...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
