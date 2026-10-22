'use client';

import { useState, useTransition } from 'react';
import { verifyPayment } from './actions';
import { Check, X, ExternalLink, AlertCircle, FileText } from 'lucide-react';

export interface PaymentItem {
  id: string;
  order_id: string;
  payment_method_code: string;
  amount: number;
  delivery_fee: number;
  subtotal: number;
  transaction_reference: string | null;
  payment_proof_url: string | null;
  payment_status: string;
  verified_at: string | null;
  verified_by: string | null;
  notes: string | null;
  created_at: string;
  order?: {
    id: string;
    restaurant?: {
      name: string;
    } | null;
  } | null;
}

interface PaymentRowProps {
  payment: PaymentItem;
  onReject: () => void;
}

export default function PaymentRow({ payment, onReject }: PaymentRowProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleVerify() {
    if (!confirm(`¿Confirmar verificación del pago por S/ ${Number(payment.amount).toFixed(2)}?`)) return;

    setError(null);
    startTransition(async () => {
      const result = await verifyPayment(payment.id);
      if (result.error) setError(result.error);
    });
  }

  const statusBadge = () => {
    switch (payment.payment_status) {
      case 'approved':
        return <span className="badge badge-success">Verificado</span>;
      case 'rejected':
        return <span className="badge" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>Rechazado</span>;
      case 'pending':
      default:
        return <span className="badge badge-warning">Por Verificar</span>;
    }
  };

  const methodBadge = () => {
    const code = payment.payment_method_code.toLowerCase();
    if (code.includes('yape')) return <span className="badge font-bold" style={{ background: '#710180', color: '#fff' }}>Yape</span>;
    if (code.includes('plin')) return <span className="badge font-bold" style={{ background: '#00A8A8', color: '#fff' }}>Plin</span>;
    if (code.includes('cash') || code.includes('efectivo')) return <span className="badge badge-neutral">Efectivo</span>;
    return <span className="badge badge-info uppercase">{payment.payment_method_code}</span>;
  };

  return (
    <tr className={isPending ? 'opacity-50' : ''}>
      {/* Pedido & Fecha */}
      <td>
        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
          #{payment.order_id.slice(0, 8)}
        </div>
        <div className="text-[11px] text-gray-400 mt-0.5">
          {payment.order?.restaurant?.name || 'Local'} · {new Date(payment.created_at).toLocaleDateString()}
        </div>
      </td>

      {/* Método */}
      <td>
        <div className="flex items-center gap-1">
          {methodBadge()}
        </div>
        {payment.transaction_reference && (
          <div className="text-[11px] font-mono text-gray-500 mt-1 truncate max-w-[140px]" title={payment.transaction_reference}>
            Ref: {payment.transaction_reference}
          </div>
        )}
      </td>

      {/* Monto */}
      <td>
        <div className="font-mono font-bold text-sm text-gray-900">
          S/ {Number(payment.amount).toFixed(2)}
        </div>
        <div className="text-[10px] text-gray-400">
          Subt: S/ {Number(payment.subtotal).toFixed(2)} + Env: S/ {Number(payment.delivery_fee).toFixed(2)}
        </div>
      </td>

      {/* Comprobante */}
      <td>
        {payment.payment_proof_url ? (
          <a
            href={payment.payment_proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
          >
            <span>Ver Comprobante</span>
            <ExternalLink style={{ width: '12px', height: '12px' }} />
          </a>
        ) : (
          <span className="text-xs text-gray-400 italic">Sin comprobante</span>
        )}
      </td>

      {/* Estado */}
      <td>
        <div>{statusBadge()}</div>
        {payment.notes && (
          <p className="text-[11px] text-red-600 mt-1 line-clamp-1 max-w-[140px]" title={payment.notes}>
            {payment.notes}
          </p>
        )}
      </td>

      {/* Acciones */}
      <td style={{ textAlign: 'right' }}>
        <div className="flex items-center justify-end gap-1.5">
          {payment.payment_status === 'pending' && (
            <>
              <button
                type="button"
                onClick={handleVerify}
                disabled={isPending}
                className="panel-btn-primary"
                style={{ background: 'var(--success)', padding: '6px 12px', fontSize: '12px' }}
                title="Aprobar pago"
              >
                <Check style={{ width: '13px', height: '13px' }} />
                <span>Validar</span>
              </button>

              <button
                type="button"
                onClick={onReject}
                disabled={isPending}
                className="panel-btn-secondary"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger-soft)', padding: '6px 12px', fontSize: '12px' }}
                title="Rechazar pago"
              >
                <X style={{ width: '13px', height: '13px' }} />
                <span>Rechazar</span>
              </button>
            </>
          )}
        </div>

        {error && <div className="mt-1 text-[11px] text-red-600 text-right">{error}</div>}
      </td>
    </tr>
  );
}
