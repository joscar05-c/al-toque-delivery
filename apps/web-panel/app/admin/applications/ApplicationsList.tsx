'use client';

import { useState, useMemo, useTransition } from 'react';
import ApplicationRow, { ApplicationItem } from './ApplicationRow';
import { rejectRestaurant } from './actions';
import { Search, Inbox, X, AlertCircle } from 'lucide-react';

interface ApplicationsListProps {
  applications: ApplicationItem[];
}

export default function ApplicationsList({ applications }: ApplicationsListProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state (lifted outside table)
  const [detailApp, setDetailApp] = useState<ApplicationItem | null>(null);
  const [rejectApp, setRejectApp] = useState<ApplicationItem | null>(null);
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
      // Filter by tab
      if (activeTab !== 'all' && app.status !== activeTab) {
        return false;
      }
      // Filter by search term
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = app.business_name.toLowerCase().includes(term);
        const matchesOwner = app.owner_name.toLowerCase().includes(term);
        const matchesPhone = app.business_phone.toLowerCase().includes(term);
        const matchesDni = app.owner_dni.toLowerCase().includes(term);
        const matchesCity = app.city.toLowerCase().includes(term);
        return matchesName || matchesOwner || matchesPhone || matchesDni || matchesCity;
      }
      return true;
    });
  }, [applications, activeTab, searchTerm]);

  function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectApp) return;

    if (!rejectReason.trim()) {
      setRejectError('Debes especificar un motivo de rechazo.');
      return;
    }

    setRejectError(null);
    startRejectTransition(async () => {
      const result = await rejectRestaurant(rejectApp.id, rejectReason);
      if (result.error) {
        setRejectError(result.error);
      } else {
        setRejectApp(null);
        setRejectReason('');
      }
    });
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-success">Aprobada</span>;
      case 'rejected':
        return <span className="badge" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>Rechazada</span>;
      case 'pending':
      default:
        return <span className="badge badge-warning">Pendiente</span>;
    }
  };

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

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por negocio, dueño, DNI..."
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
                <th>Negocio</th>
                <th>Propietario / Contacto</th>
                <th>Ubicación</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredApplications.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                    <div className="flex flex-col items-center justify-center">
                      <Inbox className="w-10 h-10 mb-2 opacity-40 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'No hay solicitudes en esta categoría'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {searchTerm ? 'Intenta buscar con otro término' : 'Nuevas solicitudes aparecerán aquí cuando los restaurantes postulen'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredApplications.map((app) => (
                  <ApplicationRow
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

      {/* MODAL DETALLE FUERA DE LA TABLA */}
      {detailApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="section-card w-full max-w-lg p-6 bg-white shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <div>
                <h3 className="text-lg font-bold" style={{ color: 'var(--ink)' }}>
                  Detalle de Solicitud
                </h3>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  ID: {detailApp.id}
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

            <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--brand)' }}>
                  Datos del Negocio
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs block" style={{ color: 'var(--ink-muted)' }}>Nombre Comercial</span>
                    <span className="font-semibold" style={{ color: 'var(--ink)' }}>{detailApp.business_name}</span>
                  </div>
                  <div>
                    <span className="text-xs block" style={{ color: 'var(--ink-muted)' }}>Categoría</span>
                    <span style={{ color: 'var(--ink)' }}>{detailApp.category?.name || 'No especificada'}</span>
                  </div>
                  <div>
                    <span className="text-xs block" style={{ color: 'var(--ink-muted)' }}>Teléfono Comercial</span>
                    <span style={{ color: 'var(--ink)' }}>{detailApp.business_phone}</span>
                  </div>
                  <div>
                    <span className="text-xs block" style={{ color: 'var(--ink-muted)' }}>Email Comercial</span>
                    <span style={{ color: 'var(--ink)' }}>{detailApp.business_email || 'No indicado'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs block" style={{ color: 'var(--ink-muted)' }}>Dirección y Ciudad</span>
                    <span style={{ color: 'var(--ink)' }}>{detailApp.address} ({detailApp.city})</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <h4 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--brand)' }}>
                  Datos del Propietario
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-xs block" style={{ color: 'var(--ink-muted)' }}>Nombre Completo</span>
                    <span className="font-medium" style={{ color: 'var(--ink)' }}>{detailApp.owner_name}</span>
                  </div>
                  <div>
                    <span className="text-xs block" style={{ color: 'var(--ink-muted)' }}>DNI</span>
                    <span style={{ color: 'var(--ink)' }}>{detailApp.owner_dni}</span>
                  </div>
                </div>
              </div>

              {detailApp.additional_comments && (
                <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-xs block mb-1 font-semibold" style={{ color: 'var(--ink-muted)' }}>
                    Comentarios del Solicitante:
                  </span>
                  <div className="p-3 rounded-md text-xs" style={{ background: 'var(--surface-inset)', color: 'var(--ink-secondary)' }}>
                    {detailApp.additional_comments}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between text-xs">
                  <span style={{ color: 'var(--ink-muted)' }}>Fecha de registro:</span>
                  <span style={{ color: 'var(--ink)' }}>{new Date(detailApp.created_at).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs mt-1.5">
                  <span style={{ color: 'var(--ink-muted)' }}>Estado:</span>
                  <div>{getStatusBadge(detailApp.status)}</div>
                </div>
                {detailApp.admin_notes && (
                  <div className="mt-2 p-2.5 rounded-md text-xs" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
                    <strong>Nota administrativa:</strong> {detailApp.admin_notes}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t flex items-center justify-end gap-2" style={{ borderColor: 'var(--border)' }}>
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

      {/* MODAL RECHAZO FUERA DE LA TABLA */}
      {rejectApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="section-card w-full max-w-md p-6 bg-white shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle style={{ width: '20px', height: '20px' }} />
              <h3 className="text-base font-bold" style={{ color: 'var(--ink)' }}>
                Rechazar Solicitud
              </h3>
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--ink-muted)' }}>
              Estás por rechazar la postulación de <strong>{rejectApp.business_name}</strong>.
              Por favor ingresa el motivo del rechazo para registro y auditoría:
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="panel-label">Motivo de Rechazo (Requerido)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ej: Documentación incompleta, número telefónico no responde, zona no cubierta actualmente..."
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
