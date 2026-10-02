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
      <div className="text-center text-gray-500 py-8">
        No hay repartidores vinculados. Agrega uno arriba.
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 text-red-600 text-sm bg-red-50 p-3 rounded">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Repartidor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contacto
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vinculado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {drivers.map((d) => (
              <tr key={d.driver_id} className={pendingRemoves.has(d.driver_id) ? 'opacity-50' : ''}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {d.users?.name ?? 'Sin nombre'}
                  </div>
                  <div className="text-sm text-gray-500">{d.users?.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{d.users?.phone ?? '—'}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(d.created_at).toLocaleDateString('es-ES')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                      className="px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
    </>
  );
}