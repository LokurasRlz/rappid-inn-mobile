import { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { useAuthStore } from '../services/authStore';

export default function RootLayout() {
  const { completeExternalAuth, loadToken } = useAuthStore();

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  useEffect(() => {
    const handleUrl = async (url: string | null) => {
      if (!url) return;

      const parsed = Linking.parse(url);
      const token = typeof parsed.queryParams?.token === 'string'
        ? parsed.queryParams.token
        : null;

      if (parsed.path === 'auth/callback' && token) {
        try {
          await completeExternalAuth(token);
          router.replace('/(app)/home');
        } catch {
          router.replace('/(auth)/login');
        }
      }
    };

    Linking.getInitialURL().then(handleUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      handleUrl(url);
    });

    return () => {
      subscription.remove();
    };
  }, [completeExternalAuth]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(app)" />
      </Stack>
    </>
  );
}
