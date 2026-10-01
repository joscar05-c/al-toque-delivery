import { supabase } from '@/lib/supabase';
import type { PaymentMethod } from '@delivery/shared';

/** Métodos de pago activos (is_active = true), orden alfabético. */
export async function fetchActivePaymentMethods(): Promise<PaymentMethod[]> {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data ?? [];
}
