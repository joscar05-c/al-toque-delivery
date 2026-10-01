import { create } from 'zustand';

import type { Address, PaymentMethod } from '@delivery/shared';

interface CheckoutState {
  /** Dirección elegida para la entrega (public.addresses). */
  selectedAddress: Address | null;
  /** Método de pago elegido (public.payment_methods). */
  selectedPaymentMethod: PaymentMethod | null;
  setAddress: (address: Address | null) => void;
  setPaymentMethod: (method: PaymentMethod | null) => void;
  reset: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  selectedAddress: null,
  selectedPaymentMethod: null,

  setAddress: (selectedAddress) => set({ selectedAddress }),
  setPaymentMethod: (selectedPaymentMethod) => set({ selectedPaymentMethod }),
  reset: () => set({ selectedAddress: null, selectedPaymentMethod: null }),
}));
