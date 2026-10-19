'use server';

import { revalidatePath } from 'next/cache';
import { authorizePanelRole, PANEL_ROLE_IDS } from '@/utils/firebase/authorization';

export async function verifyPayment(paymentId: string) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { error } = await access.supabase
    .from('order_payments')
    .update({
      payment_status: 'approved',
      verified_by: access.user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  if (error) {
    console.error('[verifyPayment] Error:', error);
    return { error: error.message || 'Error al verificar pago.' };
  }

  revalidatePath('/admin/payments');
  revalidatePath('/admin/orders');
  return { success: true };
}

export async function rejectPayment(paymentId: string, notes: string) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const trimmedNotes = notes?.trim();
  if (!trimmedNotes) {
    return { error: 'Debes indicar el motivo del rechazo del comprobante.' };
  }

  const { error } = await access.supabase
    .from('order_payments')
    .update({
      payment_status: 'rejected',
      notes: trimmedNotes,
      verified_by: access.user.id,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  if (error) {
    console.error('[rejectPayment] Error:', error);
    return { error: error.message || 'Error al rechazar comprobante de pago.' };
  }

  revalidatePath('/admin/payments');
  revalidatePath('/admin/orders');
  return { success: true };
}

export async function togglePaymentMethod(methodId: string, currentStatus: boolean) {
  const access = await authorizePanelRole(PANEL_ROLE_IDS.admin);
  if (!access) return { error: 'No autorizado' };

  const { error } = await access.supabase
    .from('payment_methods')
    .update({
      is_active: !currentStatus,
    })
    .eq('id', methodId);

  if (error) {
    console.error('[togglePaymentMethod] Error:', error);
    return { error: error.message || 'Error al cambiar estado del método de pago.' };
  }

  revalidatePath('/admin/payments');
  return { success: true };
}
