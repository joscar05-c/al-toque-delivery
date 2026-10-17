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
    <form action={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
      <input
        name="restaurantId"
        type="hidden"
        value={restaurantId}
      />
      <div>
        <label className="panel-label">Costo Base (S/.)</label>
        <input
          name="baseCost"
          type="number"
          step="0.01"
          min="0"
          value={baseCost}
          onChange={(e) => setBaseCost(e.target.value)}
          required
          className="panel-input"
          style={{ fontVariantNumeric: 'tabular-nums' }}
          disabled={isPending}
        />
      </div>
      <div>
        <label className="panel-label">Umbral Envío Gratis (S/.)</label>
        <input
          name="freeThreshold"
          type="number"
          step="0.01"
          min="0"
          value={freeThreshold}
          onChange={(e) => setFreeThreshold(e.target.value)}
          className="panel-input"
          style={{ fontVariantNumeric: 'tabular-nums' }}
          disabled={isPending}
          placeholder="Opcional"
        />
      </div>
      <div className="md:col-span-2 flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="panel-btn-primary"
        >
          {isPending ? 'Guardando...' : 'Guardar Configuración'}
        </button>
        {error && <span className="text-sm" style={{ color: 'var(--danger)' }}>{error}</span>}
        {success && (
          <span className="text-sm flex items-center gap-1" style={{ color: 'var(--success)' }}>
            ✓ Guardado
          </span>
        )}
      </div>
    </form>
  );
}
