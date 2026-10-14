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

const inputClassName =
  'mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100';

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
      className="space-y-5 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div>
        <label htmlFor="ownerId" className="block text-sm font-medium text-gray-700">
          Propietario (cuenta registrada)
        </label>
        <select
          id="ownerId"
          name="ownerId"
          className={inputClassName}
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Nombre del restaurante
          </label>
          <input
            id="name"
            name="name"
            className={inputClassName}
            maxLength={255}
            required
            disabled={isPending}
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Teléfono del restaurante
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            className={inputClassName}
            maxLength={20}
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Dirección
        </label>
        <input
          id="address"
          name="address"
          className={inputClassName}
          maxLength={255}
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">
            Ciudad
          </label>
          <select
            id="city"
            name="city"
            className={inputClassName}
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
          <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700">
            Categoría
          </label>
          <select
            id="categoryId"
            name="categoryId"
            className={inputClassName}
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
            className="block text-sm font-medium text-gray-700"
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
            className={inputClassName}
            required
            disabled={isPending}
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {success}
        </p>
      )}

      <button
        type="submit"
        disabled={isPending || owners.length === 0}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Creando restaurante...' : 'Crear restaurante'}
      </button>
    </form>
  );
}
