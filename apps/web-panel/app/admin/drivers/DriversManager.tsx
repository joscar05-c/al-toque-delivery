'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import DriverRow, { DriverItem } from './DriverRow';
import { Search, Truck, MapPin, FileText, Inbox } from 'lucide-react';

interface DriversManagerProps {
  drivers: DriverItem[];
  pendingApplicationsCount: number;
}

export default function DriversManager({
  drivers,
  pendingApplicationsCount,
}: DriversManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'online'>('all');

  const counts = useMemo(() => {
    return {
      total: drivers.length,
      active: drivers.filter((d) => d.is_active).length,
      suspended: drivers.filter((d) => !d.is_active).length,
      online: drivers.filter((d) => d.location && d.location.latitude && d.location.longitude).length,
    };
  }, [drivers]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      if (filter === 'active' && !d.is_active) return false;
      if (filter === 'suspended' && d.is_active) return false;
      if (filter === 'online' && (!d.location || !d.location.latitude)) return false;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (d.name || '').toLowerCase().includes(term);
        const matchesPhone = (d.phone || '').toLowerCase().includes(term);
        const matchesEmail = (d.email || '').toLowerCase().includes(term);
        return matchesName || matchesPhone || matchesEmail;
      }

      return true;
    });
  }, [drivers, filter, searchTerm]);

  return (
    <div className="space-y-6">
      {/* Top Banner for Pending Applications */}
      {pendingApplicationsCount > 0 && (
        <div
          className="section-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          style={{
            background: 'var(--warning-soft)',
            borderColor: 'rgba(217, 119, 6, 0.25)',
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-sm">
              {pendingApplicationsCount}
            </div>
            <div>
              <p className="font-bold text-sm text-amber-900">
                {pendingApplicationsCount} solicitud{pendingApplicationsCount === 1 ? '' : 'es'} de repartidores esperando revisión
              </p>
              <p className="text-xs text-amber-700">
                Revisa los antecedentes, licencias de conducir y vehículos antes de autorizarlos.
              </p>
            </div>
          </div>
          <Link
            href="/admin/drivers/applications"
            className="panel-btn-primary"
            style={{ background: 'var(--brand)', padding: '6px 14px', fontSize: '12px' }}
          >
            Revisar Solicitudes ↗
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Total Repartidores
          </p>
          <p className="text-2xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.total}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-green-600">
            Habilitados
          </p>
          <p className="text-2xl font-bold mt-1 text-green-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.active}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
            Con GPS Reciente
          </p>
          <p className="text-2xl font-bold mt-1 text-blue-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.online}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Suspendidos
          </p>
          <p className="text-2xl font-bold mt-1 text-gray-600" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.suspended}
          </p>
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar repartidor por nombre, teléfono..."
            className="panel-input pl-9 text-xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filters and CTA */}
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="panel-input text-xs"
            style={{ width: 'auto' }}
          >
            <option value="all">Todos los repartidores</option>
            <option value="active">Solo Habilitados</option>
            <option value="online">Solo con GPS Activo</option>
            <option value="suspended">Solo Suspendidos</option>
          </select>

          <Link
            href="/admin/drivers/applications"
            className="panel-btn-secondary text-xs"
            style={{ padding: '8px 12px' }}
          >
            <FileText style={{ width: '14px', height: '14px' }} />
            <span>Ver Solicitudes</span>
          </Link>
        </div>
      </div>

      {/* Table Card */}
      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="panel-table w-full">
            <thead>
              <tr>
                <th>Repartidor</th>
                <th>Contacto</th>
                <th>Ubicación GPS</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredDrivers.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                    <div className="flex flex-col items-center justify-center">
                      <Truck className="w-10 h-10 mb-2 opacity-40 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        {searchTerm ? 'No se encontraron repartidores con ese criterio' : 'No hay repartidores registrados en este filtro'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Los usuarios con rol &apos;driver&apos; aparecerán en esta lista tras aprobar su postulación.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDrivers.map((driver) => (
                  <DriverRow key={driver.id} driver={driver} />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
