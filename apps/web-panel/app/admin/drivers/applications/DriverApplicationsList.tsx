'use client';

import { useState, useMemo, useTransition } from 'react';
import DriverApplicationRow, { DriverApplicationItem } from './DriverApplicationRow';
import { rejectDriverApplication } from './actions';
import { Search, Inbox, X, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';

interface DriverApplicationsListProps {
  applications: DriverApplicationItem[];
}

export default function DriverApplicationsList({ applications }: DriverApplicationsListProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [detailApp, setDetailApp] = useState<DriverApplicationItem | null>(null);
  const [rejectApp, setRejectApp] = useState<DriverApplicationItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isPendingReject, startRejectTransition] = useTransition();

  const counts = useMemo(() => {
    return {
      all: applications.length,
      pending: applications.filter((a) => a.status === 'pending').length,
      approved: applications.filter((a) => a.status === 'approved').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
    };
  }, [applications]);

  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      // Tab filter
      if (activeTab !== 'all' && app.status !== activeTab) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = (app.full_name || '').toLowerCase().includes(term);
        const matchesDni = app.dni.toLowerCase().includes(term);
        const matchesPhone = (app.phone || '').toLowerCase().includes(term);
        const matchesPlate = (app.vehicle_plate || '').toLowerCase().includes(term);
        return matchesName || matchesDni || matchesPhone || matchesPlate;
      }
      return true;
    });
  }, [applications, activeTab, searchTerm]);

  function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectApp) return;

    if (!rejectReason.trim()) {
      setRejectError('El motivo de rechazo es obligatorio.');
      return;
    }

    setRejectError(null);
    startRejectTransition(async () => {
      const result = await rejectDriverApplication(rejectApp.id, rejectReason);
      if (result.error) {
        setRejectError(result.error);
      } else {
        setRejectApp(null);
        setRejectReason('');
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Controls: Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-inset)', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-white shadow-xs text-orange-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Pendientes ({counts.pending})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('approved')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'approved'
                ? 'bg-white shadow-xs text-green-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Aprobadas ({counts.approved})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rejected')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'rejected'
                ? 'bg-white shadow-xs text-red-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Rechazadas ({counts.rejected})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-white shadow-xs text-gray-900'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Todas ({counts.all})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por postulante, DNI, placa..."
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
      </div>

      {/* Table Card */}
      <div className="section-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="panel-table w-full">
            <thead>
              <tr>
                <th>Postulante</th>
                <th>Contacto</th>
                <th>Vehículo</th>
                <th>Licencia</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="w-10 h-10 mb-2 opacity-40 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        {searchTerm ? 'No se encontraron postulaciones' : 'No hay postulaciones en este estado'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Las solicitudes de nuevos repartidores registradas en la app móvil aparecerán aquí.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <DriverApplicationRow
                    key={app.id}
                    application={app}
                    onViewDetail={() => setDetailApp(app)}
                    onReject={() => {
                      setRejectApp(app);
                      setRejectReason('');
                      setRejectError(null);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DETALLE Y DOCUMENTACIÓN */}
      {detailApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="section-card w-full max-w-2xl p-6 bg-white shadow-xl relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b mb-4" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  Detalle de Postulante a Repartidor
                </h3>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  ID: {detailApp.id} · Fecha: {new Date(detailApp.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDetailApp(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            <div className="space-y-5">
              {/* Personal Info */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-orange-600">
                  Datos Personales
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-xs block text-gray-400">Nombre Completo</span>
                    <span className="font-semibold">{detailApp.full_name || 'No indicado'}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400">DNI</span>
                    <span className="font-mono">{detailApp.dni}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400">F. Nacimiento</span>
                    <span>{detailApp.birth_date ? new Date(detailApp.birth_date).toLocaleDateString() : 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400">Teléfono</span>
                    <span>{detailApp.phone || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400">Email</span>
                    <span className="truncate block">{detailApp.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400">Contacto Emergencia</span>
                    <span>{detailApp.emergency_contact_name || 'N/A'} ({detailApp.emergency_contact_phone || 'N/A'})</span>
                  </div>
                </div>
              </div>

              {/* Vehicle & License Info */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2 text-orange-600">
                  Vehículo y Licencia
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-xs block text-gray-400">Tipo</span>
                    <span className="capitalize font-semibold">{detailApp.vehicle_type}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400">Placa</span>
                    <span className="font-mono font-semibold">{detailApp.vehicle_plate || 'Sin placa'}</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400">Marca / Modelo</span>
                    <span>{detailApp.vehicle_brand || ''} {detailApp.vehicle_model || ''} ({detailApp.vehicle_year || 'N/A'})</span>
                  </div>
                  <div>
                    <span className="text-xs block text-gray-400">Licencia</span>
                    <span className="font-mono">{detailApp.license_number || 'N/A'}</span>
                    {detailApp.license_expiry && (
                      <span className="text-[11px] text-gray-400 block">Vence: {detailApp.license_expiry}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Photos & Documentation */}
              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-orange-600">
                  Documentación Adjunta
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Foto DNI', url: detailApp.dni_photo },
                    { label: 'Licencia Frontal', url: detailApp.license_front_photo },
                    { label: 'Licencia Posterior', url: detailApp.license_back_photo },
                    { label: 'Foto Vehículo', url: detailApp.vehicle_photo },
                  ].map((doc, idx) => (
                    <div key={idx} className="border rounded-lg p-2 text-center bg-gray-50 flex flex-col items-center justify-center min-h-[120px]">
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="group block w-full h-full">
                          <img
                            src={doc.url}
                            alt={doc.label}
                            className="w-full h-20 object-cover rounded mb-1 group-hover:opacity-90"
                          />
                          <span className="text-[11px] font-medium text-blue-600 group-hover:underline">
                            Ver {doc.label} ↗
                          </span>
                        </a>
                      ) : (
                        <div className="text-gray-400">
                          <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-40" />
                          <span className="text-[11px]">{doc.label}</span>
                          <span className="text-[10px] block text-gray-300">No adjuntado</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t mt-4 flex items-center justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setDetailApp(null)}
                className="panel-btn-secondary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECHAZO */}
      {rejectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="section-card w-full max-w-md p-6 bg-white shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle style={{ width: '20px', height: '20px' }} />
              <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                Rechazar Postulación de Repartidor
              </h3>
            </div>

            <p className="text-xs mb-4 text-gray-500">
              Estás por rechazar la solicitud de <strong>{rejectApp.full_name || rejectApp.dni}</strong>.
              Por favor ingresa el motivo del rechazo para registro:
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="panel-label">Motivo de Rechazo (Requerido)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: Documentos ilegibles, licencia de conducir vencida, SOAT no vigente..."
                  rows={4}
                  required
                  className="panel-input"
                  style={{ resize: 'vertical' }}
                  disabled={isPendingReject}
                />
              </div>

              {rejectError && (
                <div className="text-xs p-2 rounded" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                  {rejectError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectApp(null);
                    setRejectError(null);
                  }}
                  disabled={isPendingReject}
                  className="panel-btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPendingReject || !rejectReason.trim()}
                  className="panel-btn-primary"
                  style={{ background: 'var(--danger)' }}
                >
                  {isPendingReject ? 'Rechazando...' : 'Confirmar Rechazo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
