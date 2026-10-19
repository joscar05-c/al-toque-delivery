'use client';

import { useState, useTransition } from 'react';
import { approveRestaurant } from './actions';
import { Check, X, Eye } from 'lucide-react';

export interface ApplicationItem {
  id: string;
  business_name: string;
  business_phone: string;
  business_email: string | null;
  address: string;
  city: string;
  owner_name: string;
  owner_dni: string;
  additional_comments: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  category?: { name: string } | null;
}

interface ApplicationRowProps {
  application: ApplicationItem;
  onViewDetail: () => void;
  onReject: () => void;
}

export default function ApplicationRow({
  application,
  onViewDetail,
  onReject,
}: ApplicationRowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleApprove() {
    if (!confirm(`¿Estás seguro de aprobar la solicitud para "${application.business_name}"? Se creará el restaurante y se otorgará el rol de propietario.`)) {
      return;
    }
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await approveRestaurant(application.id);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess('¡Solicitud aprobada con éxito!');
      }
    });
  }

  const statusBadge = () => {
    switch (application.status) {
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
    <tr className={isPending ? 'opacity-50' : ''}>
      <td>
        <div className="flex items-center gap-2">
          <div>
            <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px' }}>
              {application.business_name}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                {application.category?.name || 'Sin categoría'}
              </span>
              <span className="text-xs" style={{ color: 'var(--border-strong)' }}>•</span>
              <span className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                {new Date(application.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </td>

      <td>
        <div style={{ fontSize: '13px', color: 'var(--ink)', fontWeight: 500 }}>
          {application.owner_name}
        </div>
        <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: '12px', color: 'var(--ink-muted)' }}>
          <span>DNI: {application.owner_dni}</span>
          <span>•</span>
          <span style={{ fontVariantNumeric: 'tabular-nums' }}>{application.business_phone}</span>
        </div>
      </td>

      <td>
        <div style={{ color: 'var(--ink-secondary)', fontSize: '13px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {application.address}
        </div>
        <div className="mt-0.5">
          <span className="badge badge-info text-[11px] capitalize">
            {application.city}
          </span>
        </div>
      </td>

      <td>
        {statusBadge()}
        {application.status === 'rejected' && application.admin_notes && (
          <p className="text-[11px] mt-1 line-clamp-1" style={{ color: 'var(--danger)', maxWidth: '160px' }} title={application.admin_notes}>
            Motivo: {application.admin_notes}
          </p>
        )}
      </td>

      <td style={{ textAlign: 'right' }}>
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={onViewDetail}
            className="panel-btn-secondary"
            style={{ padding: '6px 10px', fontSize: '12px' }}
            title="Ver detalle completo"
          >
            <Eye style={{ width: '14px', height: '14px' }} />
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
                title="Aprobar y crear restaurante"
              >
                <Check style={{ width: '14px', height: '14px' }} />
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
                <X style={{ width: '14px', height: '14px' }} />
                <span>Rechazar</span>
              </button>
            </>
          )}
        </div>

        {error && (
          <div style={{ marginTop: '6px', color: 'var(--danger)', fontSize: '12px', textAlign: 'right' }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ marginTop: '6px', color: 'var(--success)', fontSize: '12px', textAlign: 'right' }}>
            {success}
          </div>
        )}
      </td>
    </tr>
  );
}
