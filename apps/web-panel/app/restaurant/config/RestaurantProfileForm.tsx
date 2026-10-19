'use client';

import { useState, useTransition } from 'react';
import { updateRestaurantProfile, toggleRestaurantActive } from './actions';

interface CategoryOption {
  id: string;
  name: string;
}

interface RestaurantProfileFormProps {
  restaurant: {
    id: string;
    name: string;
    phone: string;
    address: string;
    city: string | null;
    average_prep_time: number;
    is_active: boolean;
    restaurant_category_id: string | null;
  };
  categories: CategoryOption[];
}

export default function RestaurantProfileForm({
  restaurant,
  categories,
}: RestaurantProfileFormProps) {
  const [isActive, setIsActive] = useState(restaurant.is_active);
  const [isPending, startTransition] = useTransition();
  const [isToggling, setIsToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleToggleStatus() {
    setIsToggling(true);
    setError(null);
    const result = await toggleRestaurantActive(restaurant.id, isActive);
    setIsToggling(false);
    if (result.error) {
      setError(result.error);
    } else if (result.isActive !== undefined) {
      setIsActive(result.isActive);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    formData.set('isActive', isActive ? 'true' : 'false');

    startTransition(async () => {
      const result = await updateRestaurantProfile(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Barra de estado operativo en tiempo real */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl gap-3 border"
        style={{
          background: isActive ? 'var(--success-soft)' : 'var(--danger-soft)',
          borderColor: isActive ? 'rgba(22, 163, 74, 0.2)' : 'rgba(220, 38, 38, 0.2)',
        }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-3.5 h-3.5 rounded-full flex-shrink-0 animate-pulse"
            style={{ background: isActive ? 'var(--success)' : 'var(--danger)' }}
          />
          <div>
            <h3
              className="text-sm font-bold"
              style={{ color: isActive ? 'var(--success)' : 'var(--danger)' }}
            >
              {isActive ? 'Restaurante Abierto (Operando)' : 'Restaurante Cerrado Temporalmente'}
            </h3>
            <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
              {isActive
                ? 'Los clientes pueden encontrar tu restaurante y realizar pedidos en la app móvil.'
                : 'La recepción de nuevos pedidos está pausada en la app.'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={isToggling}
          className="px-4 py-2 rounded-lg text-xs font-bold transition-opacity flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          style={{
            background: isActive ? 'var(--danger)' : 'var(--success)',
            color: '#FFFFFF',
          }}
        >
          {isToggling ? (
            'Actualizando...'
          ) : isActive ? (
            'Pausar / Cerrar Restaurante'
          ) : (
            'Abrir Restaurante'
          )}
        </button>
      </div>

      {/* Formulario de datos */}
      <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <input type="hidden" name="restaurantId" value={restaurant.id} />

        {/* Nombre Comercial */}
        <div>
          <label className="panel-label">Nombre Comercial del Restaurante</label>
          <input
            name="name"
            type="text"
            defaultValue={restaurant.name}
            required
            className="panel-input"
            disabled={isPending}
            placeholder="Ej. Burger Bros"
          />
        </div>

        {/* Categoría Gastronómica */}
        <div>
          <label className="panel-label">Categoría Gastronómica Principal</label>
          <select
            name="categoryId"
            defaultValue={restaurant.restaurant_category_id ?? ''}
            className="panel-input"
            disabled={isPending}
          >
            <option value="">Selecciona una categoría...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Teléfono */}
        <div>
          <label className="panel-label">Teléfono de Contacto / Cocina</label>
          <input
            name="phone"
            type="tel"
            defaultValue={restaurant.phone}
            required
            className="panel-input"
            disabled={isPending}
            placeholder="Ej. 921445566"
          />
        </div>

        {/* Ciudad */}
        <div>
          <label className="panel-label">Ciudad</label>
          <select
            name="city"
            defaultValue={restaurant.city ?? 'bagua'}
            className="panel-input"
            disabled={isPending}
          >
            <option value="bagua">Bagua</option>
            <option value="jaen">Jaén</option>
            <option value="chachapoyas">Chachapoyas</option>
          </select>
        </div>

        {/* Dirección Física */}
        <div className="md:col-span-2">
          <label className="panel-label">Dirección Física del Local</label>
          <input
            name="address"
            type="text"
            defaultValue={restaurant.address}
            required
            className="panel-input"
            disabled={isPending}
            placeholder="Ej. Av. Héroes del Cenepa 210"
          />
        </div>

        {/* Tiempo promedio de preparación */}
        <div>
          <label className="panel-label">Tiempo Promedio de Preparación (Minutos)</label>
          <input
            name="averagePrepTime"
            type="number"
            min="5"
            max="120"
            step="1"
            defaultValue={restaurant.average_prep_time || 20}
            required
            className="panel-input"
            disabled={isPending}
            placeholder="20"
          />
          <p className="text-[11px] mt-1" style={{ color: 'var(--ink-muted)' }}>
            Se muestra a los clientes antes de realizar su pedido.
          </p>
        </div>

        {/* Botón de guardar */}
        <div className="md:col-span-2 flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="panel-btn-primary"
          >
            {isPending ? 'Guardando cambios...' : 'Guardar Datos del Restaurante'}
          </button>
          {error && <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</span>}
          {success && (
            <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--success)' }}>
              ✓ Cambios guardados correctamente
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
