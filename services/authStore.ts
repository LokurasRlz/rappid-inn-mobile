import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand/index.js';

import { RegisterPayload, getMe, signIn, signOut, signUp } from './api';
import { useCartStore } from './cartStore';

const AUTH_TOKEN_KEY = 'auth_token';

export interface User {
  id: number;
  neighborhood_id?: number;
  neighborhood?: {
    id: number;
    name: string;
    slug: string;
  };
  neighborhood_features?: {
    expensas_enabled: boolean;
    kyc_required: boolean;
    qr_access_enabled: boolean;
  };
  name: string;
  email: string;
  avatar_url?: string;
  role: string;
  onboarding_state?: 'active' | 'pending_validation' | 'rejected' | 'requires_action';
  onboarding_reason?: string | null;
  current_lot_id?: number | null;
  current_lot?: {
    id: number;
    code: string;
    name: string;
    expenses_enabled: boolean;
  } | null;
  current_lot_member?: {
    id: number;
    role: string;
    can_access_store: boolean;
    can_charge_expenses: boolean;
    can_manage_members: boolean;
    spending_limit?: number | null;
  } | null;
  latest_incident?: {
    id: number;
    category: string;
    risk_level: 'NORMAL' | 'OBSERVED' | 'REVIEW' | 'BLOCKED';
    status: string;
    blocked_access: boolean;
    restrict_expenses: boolean;
  } | null;
  dni?: string;
  birth_date?: string;
  phone?: string;
  phone_verified_at?: string | null;
  verification_status: 'unverified' | 'pending' | 'verified';
  verified_at?: string | null;
  has_dni_front?: boolean;
  has_dni_back?: boolean;
  has_selfie?: boolean;
  cart_count?: number;
  cart_total?: number;
  lot_memberships?: Array<{
    lot_id: number;
    lot_name: string;
    lot_code: string;
    role: string;
    status: string;
    can_access_store: boolean;
    can_charge_expenses: boolean;
    can_manage_members: boolean;
    spending_limit?: number | null;
  }>;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  loadToken: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateVerification: (status: User['verification_status']) => void;
  completeExternalAuth: (token: string) => Promise<void>;
}

function hasSecureStoreMethod(method: keyof typeof SecureStore) {
  return typeof SecureStore[method] === 'function';
}

async function getStoredToken() {
  if (hasSecureStoreMethod('getItemAsync')) {
    try {
      return await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    } catch {
      // Fall through to AsyncStorage when SecureStore is unavailable.
    }
  }

  return AsyncStorage.getItem(AUTH_TOKEN_KEY);
}

async function setStoredToken(token: string) {
  if (hasSecureStoreMethod('setItemAsync')) {
    try {
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      return;
    } catch {
      // Fall through to AsyncStorage when SecureStore is unavailable.
    }
  }

  await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
}

async function clearStoredToken() {
  if (hasSecureStoreMethod('deleteItemAsync')) {
    try {
      await SecureStore.deleteItemAsync(AUTH_TOKEN_KEY);
    } catch {
      // Ignore and clear fallback storage below.
    }
  }

  await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  loadToken: async () => {
    try {
      const token = await getStoredToken();

      if (!token) {
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
        return;
      }

      const res = await getMe();
      set({
        user: res.data.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await clearStoredToken();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  login: async (email, password) => {
    const res = await signIn(email, password);
    const { token, user } = res.data.data;

    await setStoredToken(token);
    set({ user, token, isAuthenticated: true });
  },

  register: async (data) => {
    const res = await signUp(data);
    const { token, user } = res.data.data;

    await setStoredToken(token);
    set({ user, token, isAuthenticated: true });
  },

  logout: async () => {
    try {
      await signOut();
    } catch {
      // Continue clearing local state even if the API fails.
    }

    await clearStoredToken();
    useCartStore.setState({ items: [], total: 0, count: 0, summary: null, isLoading: false });
    set({ user: null, token: null, isAuthenticated: false });
  },

  refreshUser: async () => {
    try {
      const res = await getMe();
      set({ user: res.data.data });
    } catch {
      // Ignore refresh failures; the current session can continue.
    }
  },

  updateVerification: (status) => {
    const currentUser = get().user;

    if (currentUser) {
      set({
        user: {
          ...currentUser,
          verification_status: status,
          verified_at: status === 'verified' ? new Date().toISOString() : currentUser.verified_at,
        },
      });
    }
  },

  completeExternalAuth: async (token) => {
    await setStoredToken(token);

    try {
      const res = await getMe();
      set({
        user: res.data.data,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      await clearStoredToken();
      throw new Error('No se pudo completar la autenticacion externa');
    }
  },
}));
