import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontSizes, FontWeights, Shadows, Spacing } from '../../constants/theme';
import { getGoogleAuthUrl, getGoogleRedirectUri } from '../../services/api';
import { useAuthStore } from '../../services/authStore';
import { getVerificationRoute } from '../../services/verificationFlow';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Datos incompletos', 'Ingresa email y contraseña para continuar.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace(getVerificationRoute(useAuthStore.getState().user) as any);
    } catch (error: any) {
      Alert.alert('No pudimos iniciar sesión', error?.response?.data?.error || 'Revisa tus credenciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (Platform.OS === 'web') {
      window.location.assign(getGoogleAuthUrl());
      return;
    }

    const redirectUri = getGoogleRedirectUri();
    await WebBrowser.openAuthSessionAsync(getGoogleAuthUrl(), redirectUri);
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Entrar</Text>
          <Text style={styles.heroSubtitle}>
            Accede a tu cuenta para continuar con compras, acceso QR y pagos.
          </Text>
        </View>

        <Card variant="elevated" style={styles.formCard}>
          <Input label="Email" value={email} onChangeText={setEmail} placeholder="nombre@email.com" keyboardType="email-address" />
          <Input label="Contraseña" value={password} onChangeText={setPassword} placeholder="********" secureTextEntry />

          <Button label="Iniciar sesión" onPress={handleLogin} loading={loading} />
          <Button label="Continuar con Google" variant="outline" onPress={handleGoogle} />
        </Card>

        <TouchableOpacity style={styles.linkButton} onPress={() => router.replace('/(auth)/register')}>
          <Text style={styles.linkText}>Crear cuenta con email</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.md,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  backText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  hero: {
    gap: Spacing.sm,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: 40,
    fontWeight: FontWeights.extrabold,
  },
  heroSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    lineHeight: 24,
    maxWidth: 320,
  },
  formCard: {
    gap: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  linkText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
