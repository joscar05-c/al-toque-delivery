'use client';

import { useState } from 'react';
import { removeDriver } from './actions';

interface DriverListProps {
  drivers: {
    driver_id: string;
    is_active: boolean;
    created_at: string;
    users: {
      id: string;
      email: string | null;
      phone: string | null;
      name: string | null;
    } | null;
  }[];
  restaurantId: string;
}

export default function DriverList({ drivers, restaurantId }: DriverListProps) {
  const [pendingRemoves, setPendingRemoves] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  if (drivers.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        color: 'var(--ink-muted)',
        padding: '32px 0',
        fontSize: '14px',
      }}>
        No hay repartidores vinculados. Agrega uno arriba.
      </div>
    );
  }

  return (
    <>
      {error && (
        <div style={{
          marginBottom: '16px',
          padding: '12px',
          borderRadius: '8px',
          background: 'var(--danger-soft)',
          color: 'var(--danger)',
          fontSize: '14px',
        }}>
          {error}
        </div>
      )}
      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)' }}>
        <div className="overflow-x-auto">
          <table className="panel-table w-full">
            <thead>
              <tr>
                <th>Repartidor</th>
                <th>Contacto</th>
                <th>Vinculado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
            {drivers.map((d) => (
              <tr key={d.driver_id} className={pendingRemoves.has(d.driver_id) ? 'opacity-50' : ''}>
                <td>
                  <div style={{ fontWeight: 500, color: 'var(--ink)', fontSize: '14px' }}>
                    {d.users?.name ?? 'Sin nombre'}
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--ink-muted)', marginTop: '1px' }}>
                    {d.users?.email}
                  </div>
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-secondary)', fontSize: '14px' }}>
                  {d.users?.phone ?? '—'}
                </td>
                <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--ink-secondary)', fontSize: '14px' }}>
                  {new Date(d.created_at).toLocaleDateString('es-ES')}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <form action={async (formData) => {
                    const driverId = formData.get('driverId') as string;
                    if (!confirm('¿Desvincular a este repartidor?')) return;
                    setPendingRemoves((prev) => new Set(prev).add(driverId));
                    setError(null);

                    const fd = new FormData();
                    fd.append('restaurantId', restaurantId);
                    fd.append('driverId', driverId);

                    const result = await removeDriver(fd);
                    setPendingRemoves((prev) => {
                      const next = new Set(prev);
                      next.delete(driverId);
                      return next;
                    });
                    if (result.error) setError(result.error);
                  }} className="inline">
                    <input name="driverId" type="hidden" value={d.driver_id} />
                    <button
                      type="submit"
                      disabled={pendingRemoves.has(d.driver_id)}
                      className="panel-btn-secondary"
                      style={{
                        color: 'var(--danger)',
                        borderColor: 'rgba(220, 38, 38, 0.2)',
                        opacity: pendingRemoves.has(d.driver_id) ? 0.5 : 1,
                      }}
                    >
                      {pendingRemoves.has(d.driver_id) ? '...' : 'Desvincular'}
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}
