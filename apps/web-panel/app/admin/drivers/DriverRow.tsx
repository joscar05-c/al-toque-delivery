'use client';

import { useState, useTransition } from 'react';
import { toggleDriverActive } from './actions';
import { Phone, MapPin, ExternalLink, Truck } from 'lucide-react';

export interface DriverItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  phone_verified: boolean;
  is_active: boolean;
  created_at: string;
  location?: {
    latitude: number;
    longitude: number;
    speed: number | null;
    heading: number | null;
    isActive: boolean;
    updated_at: string;
  } | null;
}

interface DriverRowProps {
  driver: DriverItem;
}

export default function DriverRow({ driver }: DriverRowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await toggleDriverActive(driver.id, driver.is_active);
      if (result.error) setError(result.error);
    });
  }

  const hasLocation = driver.location && driver.location.latitude && driver.location.longitude;

  return (
    <tr className={isPending ? 'opacity-50' : ''}>
      {/* Repartidor */}
      <td>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0"
            style={{ background: 'var(--info-soft)', color: 'var(--info)' }}
          >
            <Truck style={{ width: '16px', height: '16px' }} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px' }}>
              {driver.name || 'Repartidor sin nombre'}
            </div>
            <div className="text-[11px] font-mono text-gray-400 mt-0.5">
              ID: {driver.id.slice(0, 10)}…
            </div>
          </div>
        </div>
      </td>

      {/* Contacto */}
      <td>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink)' }}>
          <Phone style={{ width: '12px', height: '12px', color: 'var(--ink-muted)' }} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {driver.phone || 'Sin teléfono'}
          </span>
        </div>
        {driver.email && (
          <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[160px]">
            {driver.email}
          </div>
        )}
      </td>

      {/* GPS / Ubicación en Vivo */}
      <td>
        {hasLocation ? (
          <div>
            <div className="flex items-center gap-1 text-xs font-mono font-medium text-blue-700">
              <MapPin style={{ width: '12px', height: '12px' }} />
              <span>
                {Number(driver.location?.latitude).toFixed(4)}, {Number(driver.location?.longitude).toFixed(4)}
              </span>
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">
              Act. {new Date(driver.location!.updated_at).toLocaleTimeString()}
              {driver.location?.speed !== null && ` · ${driver.location?.speed} km/h`}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-300"></span>
            <span>Sin señal GPS reciente</span>
          </div>
        )}
      </td>

      {/* Estado */}
      <td>
        <span className={`badge ${driver.is_active ? 'badge-success' : 'badge-neutral'}`}>
          {driver.is_active ? '● Habilitado' : '○ Suspendido'}
        </span>
      </td>

      {/* Acciones */}
      <td style={{ textAlign: 'right' }}>
        <div className="flex items-center justify-end gap-1.5">
          {hasLocation && (
            <a
              href={`https://www.google.com/maps?q=${driver.location?.latitude},${driver.location?.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="panel-btn-secondary"
              style={{ padding: '6px 10px', fontSize: '12px' }}
              title="Abrir ubicación en Google Maps"
            >
              <ExternalLink style={{ width: '12px', height: '12px' }} />
              <span className="hidden sm:inline">Mapa</span>
            </a>
          )}

          <button
            type="button"
            onClick={handleToggleActive}
            disabled={isPending}
            className={`panel-btn-secondary ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{
              padding: '6px 10px',
              fontSize: '12px',
              color: driver.is_active ? 'var(--danger)' : 'var(--success)',
              borderColor: driver.is_active ? 'var(--danger-soft)' : 'var(--success-soft)',
            }}
          >
            {isPending ? '...' : driver.is_active ? 'Suspender' : 'Habilitar'}
          </button>
        </div>

        {error && <div className="mt-1 text-[11px] text-red-600 text-right">{error}</div>}
      </td>
    </tr>
  );
}
