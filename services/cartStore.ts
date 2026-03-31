import { create } from 'zustand';

import {
  addToCart,
  clearCart,
  getCart,
  removeCartItem,
  updateCartItem,
} from './api';

export interface CartItem {
  id: number;
  product_id?: number;
  quantity: number;
  product: {
    id: number;
    name: string;
    price: number | string;
    barcode?: string;
    image_url?: string;
  };
}

interface CartState {
  items: CartItem[];
  total: number;
  count: number;
  summary: {
    items_count: number;
    total: string;
    items: CartItem[];
  } | null;
  isLoading: boolean;
  fetchCart: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  updateItem: (id: number, quantity: number) => Promise<void>;
  removeItem: (id: number) => Promise<void>;
  clearAll: () => Promise<void>;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  total: 0,
  count: 0,
  summary: null,
  isLoading: false,

  fetchCart: async () => {
    set({ isLoading: true });

    try {
      const res = await getCart();
      const data = res.data?.data ?? {};

      set({
        items: Array.isArray(data.items) ? data.items : [],
        total: Number(data.total ?? 0),
        count: Number(data.count ?? 0),
        summary: {
          items_count: Number(data.count ?? 0),
          total: Number(data.total ?? 0).toFixed(2),
          items: Array.isArray(data.items) ? data.items : [],
        },
        isLoading: false,
      });
    } catch {
      set({ items: [], total: 0, count: 0, summary: null, isLoading: false });
    }
  },

  fetchSummary: async () => {
    await get().fetchCart();
  },

  addItem: async (productId, quantity = 1) => {
    await addToCart(productId, quantity);
    await get().fetchCart();
  },

  updateItem: async (id, quantity) => {
    await updateCartItem(id, quantity);
    await get().fetchCart();
  },

  removeItem: async (id) => {
    await removeCartItem(id);
    await get().fetchCart();
  },

  clearAll: async () => {
    await clearCart();
    set({ items: [], total: 0, count: 0, summary: null });
  },
}));
