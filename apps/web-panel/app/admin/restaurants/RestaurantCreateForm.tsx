'use client';

import { useRef, useState, useTransition } from 'react';

import { createRestaurant } from './actions';

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

interface RestaurantCreateFormProps {
  owners: OwnerOption[];
  categories: CategoryOption[];
  cities: readonly CityOption[];
}

export default function RestaurantCreateForm({
  owners,
  categories,
  cities,
}: RestaurantCreateFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await createRestaurant(formData);
      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess('Restaurante creado y rol de propietario asignado.');
      formRef.current?.reset();
    });
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="section-card p-6 space-y-5"
    >
      <div>
        <label htmlFor="ownerId" className="panel-label">
          Propietario (cuenta registrada)
        </label>
        <select
          id="ownerId"
          name="ownerId"
          className="panel-input"
          required
          disabled={isPending}
          defaultValue=""
        >
          <option value="" disabled>
            Selecciona una cuenta
          </option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name} · {owner.phone || owner.email || owner.id} ·{' '}
              {owner.role_id === 3 ? 'Propietario' : 'Cliente'}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <div>
          <label htmlFor="name" className="panel-label">
            Nombre del restaurante
          </label>
          <input
            id="name"
            name="name"
            className="panel-input"
            maxLength={255}
            required
            disabled={isPending}
          />
        </div>
        <div>
          <label htmlFor="phone" className="panel-label">
            Teléfono del restaurante
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className="panel-input"
            maxLength={20}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="panel-label">
          Dirección
        </label>
        <input
          id="address"
          name="address"
          className="panel-input"
          maxLength={255}
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label htmlFor="city" className="panel-label">
            Ciudad
          </label>
          <select
            id="city"
            name="city"
            className="panel-input"
            required
            disabled={isPending}
            defaultValue=""
          >
            <option value="" disabled>
              Selecciona una ciudad
            </option>
            {cities.map((city) => (
              <option key={city.value} value={city.value}>
                {city.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="categoryId" className="panel-label">
            Categoría
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className="panel-input"
            disabled={isPending}
            defaultValue=""
          >
            <option value="">Sin categoría</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="averagePrepTime"
            className="panel-label"
          >
            Preparación promedio (min)
          </label>
          <input
            id="averagePrepTime"
            name="averagePrepTime"
            type="number"
            min={1}
            step={1}
            defaultValue={30}
            className="panel-input"
            style={{ fontVariantNumeric: 'tabular-nums' }}
            required
            disabled={isPending}
          />
        </div>
      </div>

      {error && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--danger-soft)',
          fontSize: '14px',
          color: 'var(--danger)',
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--success-soft)',
          fontSize: '14px',
          color: 'var(--success)',
        }}>
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || owners.length === 0}
        className="panel-btn-primary"
      >
        {isPending ? 'Creando restaurante...' : 'Crear restaurante'}
      </button>
    </form>
  );
}
