import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

import { useAuthStore } from '../../services/authStore';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../constants/theme';
import { GOOGLE_AUTH_URL } from '../../services/api';
import { getVerificationRoute } from '../../services/verificationFlow';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Completa email y contrasena.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace(getVerificationRoute(useAuthStore.getState().user) as any);
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo iniciar sesion.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Google en web', 'Usa email por ahora o adapta el callback web del backend.');
      return;
    }

    await WebBrowser.openBrowserAsync(GOOGLE_AUTH_URL);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Iniciar sesion</Text>
          <Text style={styles.subtitle}>
            Accede con tu cuenta o continua con Google.
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="nombre@email.com"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.label}>Contrasena</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="********"
            placeholderTextColor={Colors.textMuted}
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Entrar</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={handleGoogle}>
            <Text style={styles.secondaryButtonText}>Continuar con Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.linkText}>Crear cuenta con email</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, padding: Spacing.lg },
  backText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  header: {
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  title: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: '800',
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  form: {
    gap: Spacing.sm,
  },
  label: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    color: Colors.text,
    fontSize: FontSizes.md,
    ...Shadows.sm,
  },
  primaryButton: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  linkText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
});
