'use client';

import { useState, useTransition } from 'react';
import { approveDriverApplication } from './actions';
import { Check, X, Eye, Phone, Truck } from 'lucide-react';

export interface DriverApplicationItem {
  id: string;
  user_id: string;
  dni: string;
  vehicle_type: 'motorcycle' | 'bicycle' | 'car';
  birth_date: string;
  full_name: string | null;
  phone: string | null;
  email: string | null;
  license_number: string | null;
  license_expiry: string | null;
  vehicle_plate: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_year: number | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  dni_photo: string | null;
  license_front_photo: string | null;
  license_back_photo: string | null;
  vehicle_photo: string | null;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}

interface DriverApplicationRowProps {
  application: DriverApplicationItem;
  onViewDetail: () => void;
  onReject: () => void;
}

export default function DriverApplicationRow({
  application,
  onViewDetail,
  onReject,
}: DriverApplicationRowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleApprove() {
    if (!confirm(`¿Aprobar al postulante "${application.full_name || application.dni}" como Repartidor Oficial?`)) {
      return;
    }

    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await approveDriverApplication(application.id);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('¡Postulante aprobado y rol de repartidor asignado!');
      }
    });
  }

  const vehicleIcon = () => {
    switch (application.vehicle_type) {
      case 'motorcycle':
        return '🏍️ Moto';
      case 'bicycle':
        return '🚲 Bicicleta';
      case 'car':
        return '🚗 Auto';
      default:
        return '🛵 Vehículo';
    }
  };

  const statusBadge = () => {
    switch (application.status) {
      case 'approved':
        return <span className="badge badge-success">Aprobado</span>;
      case 'rejected':
        return <span className="badge" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>Rechazado</span>;
      case 'pending':
        return <span className="badge badge-warning">Pendiente</span>;
      case 'draft':
      default:
        return <span className="badge badge-neutral">Borrador</span>;
    }
  };

  return (
    <tr className={isPending ? 'opacity-50' : ''}>
      {/* Postulante */}
      <td>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px' }}>
            {application.full_name || 'Sin nombre registrado'}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
            <span>DNI: {application.dni}</span>
            <span>•</span>
            <span>Nac: {application.birth_date ? new Date(application.birth_date).toLocaleDateString() : 'N/A'}</span>
          </div>
        </div>
      </td>

      {/* Contacto */}
      <td>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--ink)' }}>
          <Phone style={{ width: '12px', height: '12px', color: 'var(--ink-muted)' }} />
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>
            {application.phone || 'Sin teléfono'}
          </span>
        </div>
        {application.email && (
          <div className="text-[11px] text-gray-400 mt-0.5 truncate max-w-[150px]">
            {application.email}
          </div>
        )}
      </td>

      {/* Vehículo */}
      <td>
        <div className="flex items-center gap-1.5">
          <span className="badge badge-info text-[11px]">
            {vehicleIcon()}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {application.vehicle_plate ? (
            <span className="font-mono font-semibold text-gray-700">
              {application.vehicle_plate}
            </span>
          ) : (
            'Sin placa'
          )}
          {application.vehicle_brand && ` · ${application.vehicle_brand}`}
        </div>
      </td>

      {/* Licencia */}
      <td>
        <div className="text-xs text-gray-700">
          {application.license_number ? (
            <span className="font-mono">{application.license_number}</span>
          ) : (
            <span className="text-gray-400">No requerida</span>
          )}
        </div>
        {application.license_expiry && (
          <div className="text-[11px] text-gray-400 mt-0.5">
            Vence: {new Date(application.license_expiry).toLocaleDateString()}
          </div>
        )}
      </td>

      {/* Estado */}
      <td>
        {statusBadge()}
        {application.status === 'rejected' && application.rejection_reason && (
          <p className="text-[11px] text-red-600 mt-1 line-clamp-1 max-w-[140px]" title={application.rejection_reason}>
            {application.rejection_reason}
          </p>
        )}
      </td>

      {/* Acciones */}
      <td style={{ textAlign: 'right' }}>
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onViewDetail}
            className="panel-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            title="Ver documentación y fotos"
          >
            <Eye style={{ width: '13px', height: '13px' }} />
            <span className="hidden sm:inline">Detalle</span>
          </button>

          {application.status === 'pending' && (
            <>
              <button
                type="button"
                onClick={handleApprove}
                disabled={isPending}
                className="panel-btn-primary"
                style={{ background: 'var(--success)', padding: '6px 12px', fontSize: '12px' }}
                title="Aprobar y asignar rol Driver"
              >
                <Check style={{ width: '13px', height: '13px' }} />
                <span>Aprobar</span>
              </button>

              <button
                type="button"
                onClick={onReject}
                disabled={isPending}
                className="panel-btn-secondary"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger-soft)', padding: '6px 12px', fontSize: '12px' }}
                title="Rechazar solicitud"
              >
                <X style={{ width: '13px', height: '13px' }} />
                <span>Rechazar</span>
              </button>
            </>
          )}
        </div>

        {error && <div className="mt-1 text-[11px] text-red-600 text-right">{error}</div>}
        {success && <div className="mt-1 text-[11px] text-green-600 text-right">{success}</div>}
      </td>
    </tr>
  );
}
