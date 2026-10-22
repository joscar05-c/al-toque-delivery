'use client';

import { useState, useMemo, useTransition } from 'react';
import PaymentRow, { PaymentItem } from './PaymentRow';
import { rejectPayment, togglePaymentMethod } from './actions';
import { Search, Inbox, AlertCircle, X, CheckCircle, CreditCard } from 'lucide-react';

interface PaymentMethodItem {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_active: boolean;
}

interface PaymentsManagerProps {
  payments: PaymentItem[];
  methods: PaymentMethodItem[];
}

export default function PaymentsManager({ payments, methods }: PaymentsManagerProps) {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [rejectingPayment, setRejectingPayment] = useState<PaymentItem | null>(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [isPendingReject, startRejectTransition] = useTransition();

  const counts = useMemo(() => {
    const approved = payments.filter((p) => p.payment_status === 'approved');
    const totalApprovedAmount = approved.reduce((acc, p) => acc + Number(p.amount), 0);

    return {
      total: payments.length,
      pending: payments.filter((p) => p.payment_status === 'pending').length,
      approved: approved.length,
      rejected: payments.filter((p) => p.payment_status === 'rejected').length,
      totalApprovedAmount,
    };
  }, [payments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (activeTab !== 'all' && p.payment_status !== activeTab) {
        return false;
      }
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesOrder = p.order_id.toLowerCase().includes(term);
        const matchesMethod = p.payment_method_code.toLowerCase().includes(term);
        const matchesRef = (p.transaction_reference || '').toLowerCase().includes(term);
        const matchesRest = (p.order?.restaurant?.name || '').toLowerCase().includes(term);
        return matchesOrder || matchesMethod || matchesRef || matchesRest;
      }
      return true;
    });
  }, [payments, activeTab, searchTerm]);

  function handleRejectSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!rejectingPayment) return;

    if (!rejectNotes.trim()) {
      setRejectError('Debes ingresar un motivo de rechazo.');
      return;
    }

    setRejectError(null);
    startRejectTransition(async () => {
      const result = await rejectPayment(rejectingPayment.id, rejectNotes);
      if (result.error) {
        setRejectError(result.error);
      } else {
        setRejectingPayment(null);
        setRejectNotes('');
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-600">
            Por Verificar
          </p>
          <p className="text-2xl font-bold mt-1 text-amber-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.pending}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-green-600">
            Total Verificado
          </p>
          <p className="text-2xl font-bold mt-1 text-green-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            S/ {counts.totalApprovedAmount.toFixed(2)}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600">
            Rechazados
          </p>
          <p className="text-2xl font-bold mt-1 text-red-700" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.rejected}
          </p>
        </div>
        <div className="section-card p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
            Total Transacciones
          </p>
          <p className="text-2xl font-bold mt-1 text-gray-900" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {counts.total}
          </p>
        </div>
      </div>

      {/* Payment Methods Quick Management */}
      {methods.length > 0 && (
        <div className="section-card p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">
            Métodos de Pago de la Plataforma
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {methods.map((method) => (
              <div key={method.id} className="p-3 rounded-lg border bg-gray-50/50 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-xs text-gray-900 block">{method.name}</span>
                  <span className="text-[10px] text-gray-400 uppercase font-mono">{method.code}</span>
                </div>
                <button
                  type="button"
                  onClick={() => togglePaymentMethod(method.id, method.is_active)}
                  className={`badge text-[10px] cursor-pointer hover:opacity-80 transition-opacity ${
                    method.is_active ? 'badge-success' : 'badge-neutral'
                  }`}
                >
                  {method.is_active ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Control Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: 'var(--surface-inset)', border: '1px solid var(--border)' }}>
          <button
            type="button"
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'pending'
                ? 'bg-white shadow-xs text-amber-600'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Por Verificar ({counts.pending})
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
            Aprobados ({counts.approved})
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
            Rechazados ({counts.rejected})
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
            Todos ({counts.total})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por pedido #ID, ref, método..."
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
                <th>Pedido</th>
                <th>Método</th>
                <th>Monto</th>
                <th>Comprobante</th>
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '64px 16px', textAlign: 'center', color: 'var(--ink-muted)' }}>
                    <div className="flex flex-col items-center justify-center">
                      <CreditCard className="w-10 h-10 mb-2 opacity-40 text-gray-400" />
                      <p className="text-sm font-medium text-gray-600">
                        {searchTerm ? 'No se encontraron pagos con ese criterio' : 'No hay pagos en esta categoría'}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Los comprobantes de pago de los clientes se sincronizan automáticamente.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPayments.map((payment) => (
                  <PaymentRow
                    key={payment.id}
                    payment={payment}
                    onReject={() => {
                      setRejectingPayment(payment);
                      setRejectNotes('');
                      setRejectError(null);
                    }}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL RECHAZO DE PAGO FUERA DE LA TABLA */}
      {rejectingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="section-card w-full max-w-md p-6 bg-white shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-2">
              <AlertCircle style={{ width: '20px', height: '20px' }} />
              <h3 className="text-base font-bold text-gray-900">
                Rechazar Comprobante de Pago
              </h3>
            </div>

            <p className="text-xs mb-3 text-gray-500">
              Estás por rechazar el pago del Pedido #{rejectingPayment.order_id.slice(0, 8)} por S/ {Number(rejectingPayment.amount).toFixed(2)}.
            </p>

            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <div>
                <label className="panel-label">Motivo del rechazo (Requerido)</label>
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Ej: Monto incompleto, captura adulterada, número de operación no coincide con extracto bancario..."
                  rows={3}
                  required
                  className="panel-input text-xs"
                  disabled={isPendingReject}
                />
              </div>

              {rejectError && (
                <div className="text-xs p-2 rounded bg-red-50 text-red-600">
                  {rejectError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setRejectingPayment(null)}
                  disabled={isPendingReject}
                  className="panel-btn-secondary text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isPendingReject || !rejectNotes.trim()}
                  className="panel-btn-primary text-xs"
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
