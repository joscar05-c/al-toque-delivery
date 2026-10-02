'use client';

import { useState, useTransition } from 'react';
import { updateDeliveryConfig } from './actions';

interface DeliveryConfigFormProps {
  restaurantId: string;
  initialBaseCost: number;
  initialFreeThreshold: number | null;
}

export default function DeliveryConfigForm({
  restaurantId,
  initialBaseCost,
  initialFreeThreshold,
}: DeliveryConfigFormProps) {
  const [baseCost, setBaseCost] = useState(initialBaseCost.toString());
  const [freeThreshold, setFreeThreshold] = useState(initialFreeThreshold?.toString() ?? '');
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await updateDeliveryConfig(formData);
      if (result.error) setError(result.error);
      else setSuccess(true);
    });
  }

  return (
    <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
      <input
        name="restaurantId"
        type="hidden"
        value={restaurantId}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Costo Base (S/.)</label>
        <input
          name="baseCost"
          type="number"
          step="0.01"
          min="0"
          value={baseCost}
          onChange={(e) => setBaseCost(e.target.value)}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isPending}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Umbral Envío Gratis (S/.)</label>
        <input
          name="freeThreshold"
          type="number"
          step="0.01"
          min="0"
          value={freeThreshold}
          onChange={(e) => setFreeThreshold(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          disabled={isPending}
          placeholder="Opcional"
        />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Guardando...' : 'Guardar Configuración'}
        </button>
        {error && <span className="text-red-600 text-sm">{error}</span>}
        {success && <span className="text-green-600 text-sm">✓ Guardado</span>}
      </div>
    </form>
  );
}