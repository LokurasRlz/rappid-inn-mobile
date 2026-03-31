import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import Toast from 'react-native-toast-message';

import { useAuthStore } from '../services/authStore';

export default function RootLayout() {
  const { loadToken } = useAuthStore();

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
      <Toast />
    </>
  );
}
