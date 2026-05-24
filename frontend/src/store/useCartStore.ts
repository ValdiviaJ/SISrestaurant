import { create } from 'zustand';
import { Dish, OrderItem } from '../types';
import { useSettingsStore } from './useSettingsStore';

interface CartState {
  items: OrderItem[];
  tableId: number | null;
  taxRate: number; // e.g. 0.18
  addItem: (dish: Dish, quantity?: number, notes?: string) => void;
  removeItem: (dishId: number) => void;
  updateQuantity: (dishId: number, quantity: number) => void;
  updateNotes: (dishId: number, notes: string) => void;
  setTable: (tableId: number | null) => void;
  clearCart: () => void;
  getSubtotal: () => number;
  getTax: () => number;
  getTotal: () => number;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  tableId: null,
  taxRate: 0.18, // Default 18% IGV/IVA

  addItem: (dish, quantity = 1, notes = '') => {
    set((state) => {
      const existingItemIndex = state.items.findIndex(
        (item) => item.dish_id === dish.id
      );

      if (existingItemIndex > -1) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += quantity;
        if (notes) {
          updatedItems[existingItemIndex].notes = notes;
        }
        return { items: updatedItems };
      }

      const newItem: OrderItem = {
        id: Date.now(), // Local temporary ID
        dish_id: dish.id,
        dish,
        quantity,
        price: dish.price,
        notes,
      };

      return { items: [...state.items, newItem] };
    });
  },

  removeItem: (dishId) => {
    set((state) => ({
      items: state.items.filter((item) => item.dish_id !== dishId),
    }));
  },

  updateQuantity: (dishId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(dishId);
      return;
    }
    set((state) => ({
      items: state.items.map((item) =>
        item.dish_id === dishId ? { ...item, quantity } : item
      ),
    }));
  },

  updateNotes: (dishId, notes) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.dish_id === dishId ? { ...item, notes } : item
      ),
    }));
  },

  setTable: (tableId) => set({ tableId }),

  clearCart: () => set({ items: [], tableId: null }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getTax: () => {
    const settings = useSettingsStore.getState().settings;
    const rate = settings ? settings.tax_rate / 100 : 0.18;
    return get().getSubtotal() * rate;
  },

  getTotal: () => {
    return get().getSubtotal() + get().getTax();
  },
}));
