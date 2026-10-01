import { create } from 'zustand';

import type { MenuItem } from '@delivery/shared';

export interface CartLine {
  item: MenuItem;
  quantity: number;
}

interface CartState {
  /** Un pedido pertenece a un solo restaurante (orders.restaurant_id). */
  restaurantId: string | null;
  /** Líneas del carrito indexadas por menu_item_id. */
  lines: Record<string, CartLine>;
  addItem: (restaurantId: string, item: MenuItem) => void;
  decrementItem: (itemId: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  restaurantId: null,
  lines: {},

  addItem: (restaurantId, item) =>
    set((state) => {
      // Si el carrito era de otro restaurante, se reemplaza por completo.
      const baseLines = state.restaurantId === restaurantId ? state.lines : {};
      const existing = baseLines[item.id];

      return {
        restaurantId,
        lines: {
          ...baseLines,
          [item.id]: { item, quantity: (existing?.quantity ?? 0) + 1 },
        },
      };
    }),

  decrementItem: (itemId) =>
    set((state) => {
      const existing = state.lines[itemId];
      if (!existing) return state;

      const lines = { ...state.lines };
      if (existing.quantity <= 1) {
        delete lines[itemId];
      } else {
        lines[itemId] = { ...existing, quantity: existing.quantity - 1 };
      }

      return {
        lines,
        restaurantId: Object.keys(lines).length > 0 ? state.restaurantId : null,
      };
    }),

  clear: () => set({ restaurantId: null, lines: {} }),
}));

// Selectores derivados (devuelven primitivos: seguros con Zustand v5).
export const selectTotalItems = (state: CartState): number =>
  Object.values(state.lines).reduce((acc, line) => acc + line.quantity, 0);

export const selectTotalPrice = (state: CartState): number =>
  Object.values(state.lines).reduce(
    (acc, line) => acc + line.quantity * line.item.price,
    0,
  );
