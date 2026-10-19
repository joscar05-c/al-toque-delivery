'use client';

import { useState, useTransition } from 'react';
import { updateDeliveryConfig } from './actions';

interface DeliveryConfig {
  delivery_fee: number;
  free_delivery_threshold: number | null;
  min_order_amount: number | null;
  max_delivery_distance: number;
  estimated_delivery_time: number;
  is_delivery_enabled: boolean;
  delivery_type: 'platform' | 'restaurant_own' | 'pickup_only';
}

interface DeliveryConfigFormProps {
  restaurantId: string;
  config: DeliveryConfig | null;
}

export default function DeliveryConfigForm({
  restaurantId,
  config,
}: DeliveryConfigFormProps) {
  const [isDeliveryEnabled, setIsDeliveryEnabled] = useState(
    config?.is_delivery_enabled ?? true,
  );
  const [deliveryType, setDeliveryType] = useState<
    'platform' | 'restaurant_own' | 'pickup_only'
  >(config?.delivery_type ?? 'platform');

  const [baseCost, setBaseCost] = useState(
    (config?.delivery_fee ?? 3).toString(),
  );
  const [freeThreshold, setFreeThreshold] = useState(
    config?.free_delivery_threshold?.toString() ?? '',
  );
  const [minOrder, setMinOrder] = useState(
    config?.min_order_amount?.toString() ?? '',
  );
  const [estimatedTime, setEstimatedTime] = useState(
    (config?.estimated_delivery_time ?? 30).toString(),
  );
  const [maxDistance, setMaxDistance] = useState(
    (config?.max_delivery_distance ?? 10).toString(),
  );

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    formData.set('isDeliveryEnabled', isDeliveryEnabled ? 'true' : 'false');
    formData.set('deliveryType', deliveryType);

    startTransition(async () => {
      const result = await updateDeliveryConfig(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 4000);
      }
    });
  }

  return (
    <form action={handleSubmit} className="space-y-6">
      <input name="restaurantId" type="hidden" value={restaurantId} />

      {/* Switch de entrega a domicilio */}
      <div
        className="flex items-center justify-between p-4 rounded-xl border"
        style={{
          background: isDeliveryEnabled ? 'var(--surface-inset)' : 'rgba(220, 38, 38, 0.04)',
          borderColor: isDeliveryEnabled ? 'var(--border)' : 'rgba(220, 38, 38, 0.2)',
        }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
            Recepción de Pedidos con Delivery
          </h3>
          <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
            {isDeliveryEnabled
              ? 'Los clientes pueden pedir a domicilio desde la app móvil.'
              : 'El servicio de delivery está pausado (solo se aceptará recojo en tienda).'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDeliveryEnabled(!isDeliveryEnabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isDeliveryEnabled ? 'bg-orange-600' : 'bg-gray-300'
          }`}
          role="switch"
          aria-checked={isDeliveryEnabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              isDeliveryEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Modalidad de entrega */}
      <div>
        <label className="panel-label">Modalidad de Operación de Delivery</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label
            className={`flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
              deliveryType === 'platform'
                ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-inset)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="radioDeliveryType"
                value="platform"
                checked={deliveryType === 'platform'}
                onChange={() => setDeliveryType('platform')}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-xs font-bold text-[var(--ink)]">Red Al Toque</span>
            </div>
            <p className="text-[11px] text-[var(--ink-secondary)] mt-1 ml-5">
              Repartidores independientes de la plataforma Al Toque recogen y entregan.
            </p>
          </label>

          <label
            className={`flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
              deliveryType === 'restaurant_own'
                ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-inset)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="radioDeliveryType"
                value="restaurant_own"
                checked={deliveryType === 'restaurant_own'}
                onChange={() => setDeliveryType('restaurant_own')}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-xs font-bold text-[var(--ink)]">Flota Propia</span>
            </div>
            <p className="text-[11px] text-[var(--ink-secondary)] mt-1 ml-5">
              Tu restaurante entrega con sus propios motorizados vinculados abajo.
            </p>
          </label>

          <label
            className={`flex flex-col p-3.5 rounded-xl border cursor-pointer transition-all ${
              deliveryType === 'pickup_only'
                ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-inset)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="radioDeliveryType"
                value="pickup_only"
                checked={deliveryType === 'pickup_only'}
                onChange={() => setDeliveryType('pickup_only')}
                className="text-orange-600 focus:ring-orange-500"
              />
              <span className="text-xs font-bold text-[var(--ink)]">Solo Recojo</span>
            </div>
            <p className="text-[11px] text-[var(--ink-secondary)] mt-1 ml-5">
              Los clientes deben retirar sus pedidos personalmente en el local.
            </p>
          </label>
        </div>
      </div>

      {/* Tarifas y límites numéricos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Costo Base de Delivery */}
        <div>
          <label className="panel-label">Costo Base de Delivery (S/.)</label>
          <input
            name="baseCost"
            type="number"
            step="0.10"
            min="0"
            value={baseCost}
            onChange={(e) => setBaseCost(e.target.value)}
            required
            className="panel-input"
            style={{ fontVariantNumeric: 'tabular-nums' }}
            disabled={isPending}
            placeholder="3.00"
          />
          <p className="text-[11px] mt-1 text-[var(--ink-muted)]">
            Pon 0 si ofreces delivery totalmente gratuito.
          </p>
        </div>

        {/* Umbral para Envío Gratis */}
        <div>
          <label className="panel-label">Envío Gratis en Pedidos Desde (S/.)</label>
          <input
            name="freeThreshold"
            type="number"
            step="1"
            min="0"
            value={freeThreshold}
            onChange={(e) => setFreeThreshold(e.target.value)}
            className="panel-input"
            style={{ fontVariantNumeric: 'tabular-nums' }}
            disabled={isPending}
            placeholder="Ej. 40.00 (Opcional)"
          />
          <p className="text-[11px] mt-1 text-[var(--ink-muted)]">
            Déjalo en blanco si no ofreces envío gratis por monto.
          </p>
        </div>

        {/* Pedido Mínimo */}
        <div>
          <label className="panel-label">Monto Mínimo de Pedido (S/.)</label>
          <input
            name="minOrderAmount"
            type="number"
            step="1"
            min="0"
            value={minOrder}
            onChange={(e) => setMinOrder(e.target.value)}
            className="panel-input"
            style={{ fontVariantNumeric: 'tabular-nums' }}
            disabled={isPending}
            placeholder="Ej. 15.00 (Opcional)"
          />
          <p className="text-[11px] mt-1 text-[var(--ink-muted)]">
            Compra mínima requerida para despachar.
          </p>
        </div>

        {/* Tiempo Estimado de Viaje */}
        <div>
          <label className="panel-label">Tiempo Estimado de Entrega (Minutos)</label>
          <input
            name="estimatedDeliveryTime"
            type="number"
            step="5"
            min="5"
            max="180"
            value={estimatedTime}
            onChange={(e) => setEstimatedTime(e.target.value)}
            required
            className="panel-input"
            style={{ fontVariantNumeric: 'tabular-nums' }}
            disabled={isPending}
            placeholder="30"
          />
        </div>

        {/* Radio Máximo */}
        <div>
          <label className="panel-label">Radio Máximo de Cobertura (Km)</label>
          <input
            name="maxDistance"
            type="number"
            step="1"
            min="1"
            max="50"
            value={maxDistance}
            onChange={(e) => setMaxDistance(e.target.value)}
            required
            className="panel-input"
            style={{ fontVariantNumeric: 'tabular-nums' }}
            disabled={isPending}
            placeholder="10"
          />
        </div>
      </div>

      {/* Botón de guardar */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="panel-btn-primary"
        >
          {isPending ? 'Guardando configuración...' : 'Guardar Políticas de Delivery'}
        </button>
        {error && <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>{error}</span>}
        {success && (
          <span className="text-sm font-semibold flex items-center gap-1" style={{ color: 'var(--success)' }}>
            ✓ Configuración de delivery guardada
          </span>
        )}
      </div>
    </form>
  );
}
