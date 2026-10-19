import { redirect } from 'next/navigation';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';
import PaymentsManager from './PaymentsManager';
import { PaymentItem } from './PaymentRow';

export default async function AdminPaymentsPage() {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) redirect('/dashboard-redirect');

  const [paymentsResult, methodsResult] = await Promise.all([
    access.supabase
      .from('order_payments')
      .select(`
        id,
        order_id,
        payment_method_code,
        amount,
        delivery_fee,
        subtotal,
        transaction_reference,
        payment_proof_url,
        payment_status,
        verified_at,
        verified_by,
        notes,
        created_at,
        order:orders(
          id,
          restaurant:restaurants(name)
        )
      `)
      .order('created_at', { ascending: false }),
    access.supabase
      .from('payment_methods')
      .select('id, code, name, description, is_active')
      .order('name'),
  ]);

  if (paymentsResult.error) {
    console.error('[AdminPaymentsPage] Error cargando pagos:', paymentsResult.error);
    return (
      <div className="section-card p-5" style={{ color: 'var(--danger)' }}>
        <p className="font-semibold text-sm">Error al cargar pagos y finanzas</p>
        <p className="text-xs mt-1 opacity-80">{paymentsResult.error.message}</p>
      </div>
    );
  }

  const payments = (paymentsResult.data ?? []) as unknown as PaymentItem[];
  const methods = methodsResult.data ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Finanzas y Verificación de Pagos</h1>
        <p className="page-subtitle">
          Concilia transferencias bancarias, Yape/Plin y habilita métodos de pago para los clientes.
        </p>
      </div>

      <PaymentsManager payments={payments} methods={methods} />
    </div>
  );
}
