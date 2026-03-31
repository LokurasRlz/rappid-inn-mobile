import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { useAuthStore } from '../../services/authStore';
import { getVerificationRoute } from '../../services/verificationFlow';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.verification_status === 'verified') {
      router.replace(getVerificationRoute(user) as any);
    }
  }, [isAuthenticated, isLoading, user]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="verify-doc" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="verify-selfie" />
    </Stack>
  );
}
