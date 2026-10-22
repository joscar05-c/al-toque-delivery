import { create } from 'zustand';

import type { MenuItem } from '@delivery/shared';

export interface SelectedOptionInfo {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  extraPrice: number;
}

export interface CartLine {
  item: MenuItem;
  quantity: number;
  selectedOptions?: SelectedOptionInfo[];
  unitPrice: number;
}

export function getCartLineKey(
  itemId: string,
  selectedOptions?: SelectedOptionInfo[],
): string {
  if (!selectedOptions || selectedOptions.length === 0) return itemId;
  const sorted = [...selectedOptions].map((o) => o.optionId).sort().join(',');
  return `${itemId}::${sorted}`;
}

interface CartState {
  /** Un pedido pertenece a un solo restaurante (orders.restaurant_id). */
  restaurantId: string | null;
  /** Líneas del carrito indexadas por lineKey. */
  lines: Record<string, CartLine>;
  addItem: (
    restaurantId: string,
    item: MenuItem,
    quantity?: number,
    selectedOptions?: SelectedOptionInfo[],
  ) => void;
  decrementItem: (lineKey: string) => void;
  clear: () => void;
}

export const useCartStore = create<CartState>((set) => ({
  restaurantId: null,
  lines: {},

  addItem: (restaurantId, item, quantity = 1, selectedOptions) =>
    set((state) => {
      // Si el carrito era de otro restaurante, se reemplaza por completo.
      const baseLines = state.restaurantId === restaurantId ? state.lines : {};
      const lineKey = getCartLineKey(item.id, selectedOptions);
      const existing = baseLines[lineKey];

      const extraTotal = (selectedOptions ?? []).reduce(
        (sum, opt) => sum + (Number(opt.extraPrice) || 0),
        0,
      );
      const unitPrice = item.price + extraTotal;

      return {
        restaurantId,
        lines: {
          ...baseLines,
          [lineKey]: {
            item,
            quantity: (existing?.quantity ?? 0) + quantity,
            selectedOptions:
              selectedOptions && selectedOptions.length > 0
                ? selectedOptions
                : undefined,
            unitPrice: existing?.unitPrice ?? unitPrice,
          },
        },
      };
    }),

  decrementItem: (lineKey) =>
    set((state) => {
      const existing = state.lines[lineKey];
      if (!existing) return state;

      const lines = { ...state.lines };
      if (existing.quantity <= 1) {
        delete lines[lineKey];
      } else {
        lines[lineKey] = { ...existing, quantity: existing.quantity - 1 };
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
    (acc, line) => acc + line.quantity * line.unitPrice,
    0,
  );

export const getItemQuantityInCart = (
  lines: Record<string, CartLine>,
  itemId: string,
): number =>
  Object.values(lines)
    .filter((line) => line.item.id === itemId)
    .reduce((sum, line) => sum + line.quantity, 0);
