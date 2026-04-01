import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import axios from 'axios';

const AUTH_TOKEN_KEY = 'auth_token';
const INVITE_CONTEXT_KEY = 'invite_context';

type InviteContext = {
  inviteCode?: string;
  inviteToken?: string;
  neighborhoodName?: string;
  neighborhoodSlug?: string;
  inviteType?: 'neighborhood' | 'lot_member';
  invitedEmail?: string;
  lotId?: number;
  lotCode?: string;
  lotName?: string;
};

let inviteContextCache: InviteContext | null = null;

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

async function getStoredInviteContext() {
  if (inviteContextCache) return inviteContextCache;

  const raw = await AsyncStorage.getItem(INVITE_CONTEXT_KEY);
  if (!raw) return null;

  try {
    inviteContextCache = JSON.parse(raw) as InviteContext;
    return inviteContextCache;
  } catch {
    await AsyncStorage.removeItem(INVITE_CONTEXT_KEY);
    return null;
  }
}

function resolveApiUrl() {
  const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  const fallbackNative = 'http://192.168.68.59:3000/api/v1';
  const fallbackWeb = 'http://127.0.0.1:3000/api/v1';

  if (Platform.OS === 'web') {
    return configuredUrl
      ?.replace(/:\/\/(?:localhost|127\.0\.0\.1|192\.168\.\d+\.\d+):3000/, '://127.0.0.1:3000') ?? fallbackWeb;
  }

  return configuredUrl ?? fallbackNative;
}

export const API_URL = resolveApiUrl();

export async function hydrateInviteContext() {
  return getStoredInviteContext();
}

export async function setInviteContext(context: InviteContext) {
  inviteContextCache = context;
  await AsyncStorage.setItem(INVITE_CONTEXT_KEY, JSON.stringify(context));
}

export async function clearInviteContext() {
  inviteContextCache = null;
  await AsyncStorage.removeItem(INVITE_CONTEXT_KEY);
}

export function getInviteContext() {
  return inviteContextCache;
}

export function getGoogleRedirectUri() {
  if (Platform.OS === 'web') {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081';
    return `${origin}/auth/callback`;
  }

  return Linking.createURL('auth/callback');
}

export function getGoogleAuthUrl() {
  const redirectUri = getGoogleRedirectUri();
  const authBaseUrl = Platform.OS === 'web'
    ? API_URL.replace('127.0.0.1:3000', 'localhost:3000')
    : API_URL;
  const params = new URLSearchParams({
    client_redirect_uri: redirectUri,
  });

  if (inviteContextCache?.inviteCode) {
    params.set('invite_code', inviteContextCache.inviteCode);
  }

  if (inviteContextCache?.inviteToken) {
    params.set('invite_token', inviteContextCache.inviteToken);
  }

  return `${authBaseUrl}/auth/google_oauth2?${params.toString()}`;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getStoredToken();
    const inviteContext = await getStoredInviteContext();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (inviteContext?.inviteCode) {
      config.headers['X-Neighborhood-Invite-Code'] = inviteContext.inviteCode;
    }

    if (inviteContext?.inviteToken) {
      config.headers['X-Neighborhood-Invite-Token'] = inviteContext.inviteToken;
    }
  } catch {
    // Ignore token read failures and continue unauthenticated.
  }

  return config;
});

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  dni?: string;
  birth_date?: string;
  phone?: string;
  lot_id?: string;
  activation_code?: string;
}

export type PaymentMethod = 'DIRECT' | 'EXPENSE';
export type DirectPaymentProvider = 'MERCADOPAGO' | 'CARD';
export type DoorMode = 'entry' | 'exit';
export type LotMemberRole = 'owner' | 'family' | 'authorized';

export interface LotMemberPayload {
  id: number;
  lot_id: number;
  neighborhood_id: number;
  user_id?: number | null;
  invited_email: string;
  role: LotMemberRole;
  status: string;
  can_access_store: boolean;
  can_charge_expenses: boolean;
  can_manage_members: boolean;
  spending_limit?: number | null;
  monthly_spend?: number | null;
  invitation_token?: string | null;
  accepted_at?: string | null;
  invited_by_user_id?: number | null;
}

export const signIn = (email: string, password: string) =>
  api.post('/auth/sign_in', { user: { email, password } });

export const signUp = (data: RegisterPayload) =>
  api.post('/auth/sign_up', { user: data, lot_id: data.lot_id, activation_code: data.activation_code });

export const resolveNeighborhoodInvite = (inviteValue: string) =>
  api.get('/onboarding/invite', {
    params: inviteValue.includes('-')
      ? { invite_token: inviteValue }
      : { invite_code: inviteValue },
  });

export const validateOnboardingLot = (lotId: string, activationCode?: string) =>
  api.post('/onboarding/validate_lot', { lot_id: lotId, activation_code: activationCode });

export const signOut = () => api.delete('/auth/sign_out');
export const getMe = () => api.get('/me');

export const sendOtp = (phone: string) =>
  api.post('/verification/send_otp', { phone });

export const verifyOtp = (otp: string) =>
  api.post('/verification/verify_otp', { otp });

export const uploadDocument = (side: 'front' | 'back', imageBase64: string) =>
  api.post('/verification/upload_document', { side, image: imageBase64 });

export const uploadSelfie = (imageBase64: string) =>
  api.post('/verification/upload_selfie', { image: imageBase64 });

export const autoVerify = () =>
  api.post('/verification/auto_verify');

export const getVerificationStatus = () =>
  api.get('/verification/status');

export const getProducts = (page = 1, category?: string) =>
  api.get('/products', { params: { page, category } });

export const getProductByBarcode = (barcode: string) =>
  api.get(`/products/barcode/${barcode}`);

export const searchProducts = (q: string) =>
  api.get('/products/search', { params: { q } });

export const getCart = () => api.get('/cart_items');
export const getCartSummary = () => api.get('/cart_items/summary');
export const addToCart = (productId: number, quantity = 1) =>
  api.post('/cart_items', { product_id: productId, quantity });
export const updateCartItem = (id: number, quantity: number) =>
  api.patch(`/cart_items/${id}`, { quantity });
export const removeCartItem = (id: number) => api.delete(`/cart_items/${id}`);
export const clearCart = () => api.delete('/cart_items/clear');

export const getOrders = () => api.get('/orders');
export const getOrder = (id: number) => api.get(`/orders/${id}`);
export const createOrder = (
  paymentMethod: PaymentMethod = 'DIRECT',
  paymentProvider?: DirectPaymentProvider,
) => api.post('/orders', { payment_method: paymentMethod, payment_provider: paymentProvider });

export const createPaymentPreference = (orderId: number) =>
  api.post('/payments/create_preference', { order_id: orderId });

export const confirmManualPayment = (orderId: number) =>
  api.post('/payments/confirm_manual', { order_id: orderId });

export const getPaymentStatus = (orderId: number) =>
  api.get('/payments/status', { params: { order_id: orderId } });

export const getLotBalance = () => api.get('/expenses/balance');

export const getMonthlyConsumption = (month?: string) =>
  api.get('/expenses/monthly_consumption', { params: month ? { month } : undefined });

export const getLotMembers = () => api.get<{ success: boolean; data: LotMemberPayload[] }>('/lot_members');

export const inviteLotMember = (payload: {
  invited_email: string;
  role: LotMemberRole;
  can_access_store?: boolean;
  can_charge_expenses?: boolean;
  can_manage_members?: boolean;
  spending_limit?: number | null;
}) => api.post<{ success: boolean; data: LotMemberPayload }>('/lot_members/invite', { lot_member: payload });

export const updateLotMemberRole = (id: number, role: LotMemberRole) =>
  api.patch<{ success: boolean; data: LotMemberPayload }>(`/lot_members/${id}/role`, { role });

export const updateLotMemberLimits = (id: number, payload: {
  can_access_store?: boolean;
  can_charge_expenses?: boolean;
  can_manage_members?: boolean;
  spending_limit?: number | null;
}) => api.patch<{ success: boolean; data: LotMemberPayload }>(`/lot_members/${id}/limits`, { lot_member: payload });

export const revokeLotMember = (id: number) =>
  api.patch<{ success: boolean; data: LotMemberPayload }>(`/lot_members/${id}/revoke`);

export const restoreLotMember = (id: number) =>
  api.patch<{ success: boolean; data: LotMemberPayload }>(`/lot_members/${id}/restore`);

export const generateAccessQr = (mode: DoorMode, orderId?: number, qrData?: string, location?: string) =>
  api.post('/doors/generate_qr', {
    mode,
    order_id: orderId,
    qr_data: qrData,
    location,
  });

export const openEntryDoor = (accessToken: string, qrData?: string, location?: string) =>
  api.post(
    '/doors/entry',
    { access_token: accessToken, qr_data: qrData, location },
    { headers: { 'Idempotency-Key': `entry-${accessToken}` } },
  );

export const openExitDoor = (orderId: number, accessToken: string, qrData?: string, location?: string) =>
  api.post(
    '/doors/exit',
    { order_id: orderId, access_token: accessToken, qr_data: qrData, location },
    { headers: { 'Idempotency-Key': `exit-${accessToken}` } },
  );

export const getDoorStatus = () => api.get('/doors/status');
export const getEwelinkStatus = () => api.get('/doors/test_ewelink');
export const diagnoseEwelinkDevices = () => api.get('/doors/diagnose_ewelink');
export const getEwelinkAuthUrl = () => api.get('/doors/ewelink_auth_url');

export const validateStoreQr = (mode: DoorMode, accessToken: string, qrData: string, orderId?: number, location?: string) =>
  api.post(
    '/doors/validate',
    {
      mode,
      access_token: accessToken,
      qr_data: qrData,
      order_id: orderId,
      location,
    },
    { headers: { 'Idempotency-Key': `validate-${accessToken}` } },
  );

export default api;
