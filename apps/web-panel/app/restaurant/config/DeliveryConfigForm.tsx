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

  // Guardamos la última modalidad activa para restaurarla si reactiva el switch
  const [lastActiveType, setLastActiveType] = useState<
    'platform' | 'restaurant_own'
  >(
    config?.delivery_type === 'restaurant_own'
      ? 'restaurant_own'
      : 'platform',
  );

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

  function handleToggleDelivery() {
    if (isDeliveryEnabled) {
      // Al desactivar delivery, cambiamos a modo solo recojo
      setIsDeliveryEnabled(false);
      setDeliveryType('pickup_only');
    } else {
      // Al reactivar delivery, restauramos la última modalidad elegida
      setIsDeliveryEnabled(true);
      setDeliveryType(lastActiveType);
    }
  }

  function handleSelectType(type: 'platform' | 'restaurant_own' | 'pickup_only') {
    setDeliveryType(type);
    if (type !== 'pickup_only') {
      setLastActiveType(type);
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    const effectiveDeliveryType = isDeliveryEnabled ? deliveryType : 'pickup_only';
    formData.set('isDeliveryEnabled', isDeliveryEnabled ? 'true' : 'false');
    formData.set('deliveryType', effectiveDeliveryType);

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

  const effectiveType = isDeliveryEnabled ? deliveryType : 'pickup_only';

  return (
    <form action={handleSubmit} className="space-y-6">
      <input name="restaurantId" type="hidden" value={restaurantId} />

      {/* Switch Maestro de entrega a domicilio */}
      <div
        className="flex items-center justify-between p-4 rounded-xl border transition-colors"
        style={{
          background: isDeliveryEnabled ? 'var(--surface-inset)' : 'rgba(239, 68, 68, 0.05)',
          borderColor: isDeliveryEnabled ? 'var(--border)' : 'rgba(239, 68, 68, 0.25)',
        }}
      >
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              Recepción de Pedidos con Delivery
            </h3>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isDeliveryEnabled
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              {isDeliveryEnabled ? 'Activo' : 'Solo Recojo'}
            </span>
          </div>
          <p className="text-xs" style={{ color: 'var(--ink-secondary)' }}>
            {isDeliveryEnabled
              ? 'Los clientes pueden ordenar pedidos con entrega a domicilio.'
              : 'El delivery está desactivado. Tu restaurante solo recibirá órdenes para retirar en tienda.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggleDelivery}
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

      {/* Selector de Modalidad */}
      <div>
        <label className="panel-label">Modalidad de Operación de Delivery</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Opción 1: Red Al Toque */}
          <button
            type="button"
            disabled={!isDeliveryEnabled}
            onClick={() => handleSelectType('platform')}
            className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
              !isDeliveryEnabled
                ? 'opacity-40 cursor-not-allowed bg-[var(--surface-inset)] border-[var(--border)]'
                : effectiveType === 'platform'
                  ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-inset)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  effectiveType === 'platform' && isDeliveryEnabled
                    ? 'border-orange-600 bg-orange-600'
                    : 'border-gray-400 bg-white'
                }`}
              >
                {effectiveType === 'platform' && isDeliveryEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
              <span className="text-xs font-bold text-[var(--ink)]">Red Al Toque</span>
            </div>
            <p className="text-[11px] text-[var(--ink-secondary)] mt-1.5 ml-5">
              Repartidores de la plataforma Al Toque gestionan la entrega. Tarifa calculada automáticamente.
            </p>
          </button>

          {/* Opción 2: Flota Propia */}
          <button
            type="button"
            disabled={!isDeliveryEnabled}
            onClick={() => handleSelectType('restaurant_own')}
            className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
              !isDeliveryEnabled
                ? 'opacity-40 cursor-not-allowed bg-[var(--surface-inset)] border-[var(--border)]'
                : effectiveType === 'restaurant_own'
                  ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                  : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-inset)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  effectiveType === 'restaurant_own' && isDeliveryEnabled
                    ? 'border-orange-600 bg-orange-600'
                    : 'border-gray-400 bg-white'
                }`}
              >
                {effectiveType === 'restaurant_own' && isDeliveryEnabled && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
              <span className="text-xs font-bold text-[var(--ink)]">Flota Propia</span>
            </div>
            <p className="text-[11px] text-[var(--ink-secondary)] mt-1.5 ml-5">
              Tus propios motorizados entregan los pedidos. Tú fijas costo de envío y radio en Km.
            </p>
          </button>

          {/* Opción 3: Solo Recojo */}
          <button
            type="button"
            onClick={() => {
              if (isDeliveryEnabled) {
                setIsDeliveryEnabled(false);
              }
              handleSelectType('pickup_only');
            }}
            className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
              effectiveType === 'pickup_only'
                ? 'border-orange-500 bg-orange-50/50 shadow-xs'
                : 'border-[var(--border)] bg-[var(--surface)] hover:bg-[var(--surface-inset)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <span
                className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                  effectiveType === 'pickup_only'
                    ? 'border-orange-600 bg-orange-600'
                    : 'border-gray-400 bg-white'
                }`}
              >
                {effectiveType === 'pickup_only' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </span>
              <span className="text-xs font-bold text-[var(--ink)]">Solo Recojo</span>
            </div>
            <p className="text-[11px] text-[var(--ink-secondary)] mt-1.5 ml-5">
              Clientes retiran directamente en tu local. No se requiere logística de despacho.
            </p>
          </button>
        </div>
      </div>

      {/* Banner Explicativo Condicional */}
      {effectiveType === 'platform' && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
              <span className="text-sm">⚡</span> Logística Gestionada por Al Toque
            </h4>
            <p className="text-[11px] text-blue-700 leading-relaxed">
              La plataforma asigna automáticamente los pedidos al repartidor más cercano. La tarifa de delivery que paga el cliente y el radio de cobertura se calculan en tiempo real vía GPS según la distancia.
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 text-[10px] font-semibold text-blue-800">
            <span className="px-2 py-1 rounded-md bg-blue-100">Tarifa Dinámica</span>
            <span className="px-2 py-1 rounded-md bg-blue-100">Radio GPS</span>
          </div>
        </div>
      )}

      {effectiveType === 'restaurant_own' && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 space-y-1">
          <h4 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
            <span className="text-sm">🛵</span> Logística de tu Propio Restaurante
          </h4>
          <p className="text-[11px] text-amber-700 leading-relaxed">
            Configura la tarifa que cobrarás a tus clientes, tu radio de entrega y el tiempo estimado. Podrás vincular a tus motorizados en la sección de flota ubicada más abajo.
          </p>
        </div>
      )}

      {effectiveType === 'pickup_only' && (
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-1">
          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <span className="text-sm">🏬</span> Modo Solo Recojo en Tienda
          </h4>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Los clientes ordenarán desde la app móvil y se acercarán a recoger su pedido a tu local. No se aplicarán costos de envío ni límites de distancia.
          </p>
        </div>
      )}

      {/* Campos del Formulario Condicionales */}
      <div className="space-y-4">
        {/* Caso 1: Flota Propia -> Campos de Tarifas y Límites completos */}
        {effectiveType === 'restaurant_own' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Costo Base de Delivery */}
            <div>
              <label className="panel-label">Costo de Envío al Cliente (S/.) *</label>
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
                Tarifa que abonará el cliente por el envío a domicilio.
              </p>
            </div>

            {/* Umbral para Envío Gratis */}
            <div>
              <label className="panel-label">Envío Gratis Desde (S/.)</label>
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
                Déjalo vacío si no ofreces envío gratis.
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

            {/* Tiempo Estimado de Entrega */}
            <div>
              <label className="panel-label">Tiempo Total Estimado (Minutos) *</label>
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
              <p className="text-[11px] mt-1 text-[var(--ink-muted)]">
                Tiempo promedio de preparación + viaje del repartidor.
              </p>
            </div>

            {/* Radio Máximo */}
            <div>
              <label className="panel-label">Radio Máximo de Cobertura (Km) *</label>
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
              <p className="text-[11px] mt-1 text-[var(--ink-muted)]">
                Distancia máxima a la que tus repartidores entregan.
              </p>
            </div>
          </div>
        )}

        {/* Caso 2: Red Al Toque -> Solo Pedido Mínimo y Tiempo de Preparación */}
        {effectiveType === 'platform' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                Monto mínimo que debe comprar el cliente para solicitar delivery.
              </p>
            </div>

            <div>
              <label className="panel-label">Tiempo Estimado de Preparación (Minutos) *</label>
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
                placeholder="25"
              />
              <p className="text-[11px] mt-1 text-[var(--ink-muted)]">
                Tiempo que necesita tu cocina antes de entregar el paquete al rider de Al Toque.
              </p>
            </div>
          </div>
        )}

        {/* Caso 3: Solo Recojo -> Pedido Mínimo y Tiempo de Preparación */}
        {effectiveType === 'pickup_only' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="panel-label">Monto Mínimo para Retiro en Tienda (S/.)</label>
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
                placeholder="Ej. 10.00 (Opcional)"
              />
              <p className="text-[11px] mt-1 text-[var(--ink-muted)]">
                Déjalo vacío si no exiges un mínimo de consumo.
              </p>
            </div>

            <div>
              <label className="panel-label">Tiempo Estimado de Preparación (Minutos) *</label>
              <input
                name="estimatedDeliveryTime"
                type="number"
                step="5"
                min="5"
                max="120"
                value={estimatedTime}
                onChange={(e) => setEstimatedTime(e.target.value)}
                required
                className="panel-input"
                style={{ fontVariantNumeric: 'tabular-nums' }}
                disabled={isPending}
                placeholder="20"
              />
              <p className="text-[11px] mt-1 text-[var(--ink-muted)]">
                Tiempo tras el cual el cliente puede acercarse a retirar su orden.
              </p>
            </div>
          </div>
        )}
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
            ✓ Configuración de delivery guardada correctamente
          </span>
        )}
      </div>
    </form>
  );
}
