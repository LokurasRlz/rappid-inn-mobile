import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import axios from 'axios';

const AUTH_TOKEN_KEY = 'auth_token';

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

function resolveApiUrl() {
  const configuredUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;
  const fallbackNative = 'http://192.168.3.104:3000/api/v1';
  const fallbackWeb = 'http://127.0.0.1:3000/api/v1';

  if (Platform.OS === 'web') {
    return configuredUrl?.replace('192.168.3.104', '127.0.0.1').replace('localhost', '127.0.0.1') ?? fallbackWeb;
  }

  return configuredUrl ?? fallbackNative;
}

export const API_URL = resolveApiUrl();

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

  return `${authBaseUrl}/auth/google_oauth2?client_redirect_uri=${encodeURIComponent(redirectUri)}`;
}

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await getStoredToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
}

export type PaymentMethod = 'mercadopago' | 'card' | 'expensas';
export type DoorMode = 'entry' | 'exit';

export const signIn = (email: string, password: string) =>
  api.post('/auth/sign_in', { user: { email, password } });

export const signUp = (data: RegisterPayload) =>
  api.post('/auth/sign_up', { user: data });

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
export const createOrder = (paymentMethod: PaymentMethod = 'mercadopago', expensasUnit?: string) =>
  api.post('/orders', { payment_method: paymentMethod, expensas_unit: expensasUnit });

export const createPaymentPreference = (orderId: number) =>
  api.post('/payments/create_preference', { order_id: orderId });

export const confirmManualPayment = (orderId: number) =>
  api.post('/payments/confirm_manual', { order_id: orderId });

export const getPaymentStatus = (orderId: number) =>
  api.get('/payments/status', { params: { order_id: orderId } });

export const openEntryDoor = (qrData?: string, location?: string) =>
  api.post('/doors/entry', { qr_data: qrData, location });

export const openExitDoor = (orderId: number, qrData?: string, location?: string) =>
  api.post('/doors/exit', { order_id: orderId, qr_data: qrData, location });

export const getDoorStatus = () => api.get('/doors/status');
export const getEwelinkStatus = () => api.get('/doors/test_ewelink');
export const diagnoseEwelinkDevices = () => api.get('/doors/diagnose_ewelink');
export const getEwelinkAuthUrl = () => api.get('/doors/ewelink_auth_url');

export const validateStoreQr = (mode: DoorMode, qrData: string, orderId?: number, location?: string) =>
  mode === 'exit'
    ? openExitDoor(orderId || 0, qrData, location)
    : openEntryDoor(qrData, location);

export default api;
