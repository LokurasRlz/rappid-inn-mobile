import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { Colors, FontSizes, FontWeights, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../services/authStore';
import { getVerificationRoute } from '../../services/verificationFlow';

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ token?: string; error?: string }>();
  const { completeExternalAuth } = useAuthStore();
  const [message, setMessage] = useState('Validando acceso con Google...');

  useEffect(() => {
    const finishAuth = async () => {
      if (params.error) {
        setMessage('Google devolvio un error. Te llevamos de nuevo al login.');
        setTimeout(() => router.replace('/(auth)/login'), 1200);
        return;
      }

      if (!params.token || typeof params.token !== 'string') {
        setMessage('No recibimos el token de autenticacion.');
        setTimeout(() => router.replace('/(auth)/login'), 1200);
        return;
      }

      try {
        await completeExternalAuth(params.token);
        router.replace(getVerificationRoute(useAuthStore.getState().user) as any);
      } catch {
        setMessage('No pudimos completar la sesion con Google.');
        setTimeout(() => router.replace('/(auth)/login'), 1200);
      }
    };

    void finishAuth();
  }, [completeExternalAuth, params.error, params.token]);

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.title}>Ingresando con Google</Text>
        <Text style={styles.body}>{message}</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.xl,
    gap: Spacing.md,
    alignItems: 'center',
  },
  title: {
    color: Colors.text,
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
    textAlign: 'center',
  },
  body: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    lineHeight: 22,
    textAlign: 'center',
  },
});
