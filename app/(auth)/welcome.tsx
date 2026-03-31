import { Alert, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../services/authStore';
import { GOOGLE_AUTH_URL } from '../../services/api';
import { getVerificationRoute, requiresIdentityVerification } from '../../services/verificationFlow';

export default function WelcomeScreen() {
  const { isAuthenticated, logout, user } = useAuthStore();

  const handleGoogle = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Google en web',
        'El callback de Google esta preparado para deep link movil. Para web conviene usar email por ahora o adaptar el callback del backend.',
      );
      return;
    }

    await WebBrowser.openBrowserAsync(GOOGLE_AUTH_URL);
  };

  const handleContinueVerification = () => {
    router.push(getVerificationRoute(user) as any);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.hero}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>RI</Text>
        </View>
        <Text style={styles.title}>Rapid Inn</Text>
        <Text style={styles.subtitle}>
          Registro, verificacion de identidad, ingreso por QR y compra sin filas.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>
          {isAuthenticated && requiresIdentityVerification(user) && user?.verification_status !== 'verified'
            ? 'Tienes una verificacion pendiente'
            : 'Como quieres continuar'}
        </Text>

        {isAuthenticated && requiresIdentityVerification(user) && user?.verification_status !== 'verified' ? (
          <>
            <View style={styles.pendingCard}>
              <Text style={styles.pendingLabel}>Cuenta iniciada</Text>
              <Text style={styles.pendingText}>
                {user?.email}
              </Text>
              <Text style={styles.pendingHint}>
                Debes completar DNI, OTP y selfie antes de usar la aplicacion.
              </Text>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleContinueVerification}>
              <Text style={styles.primaryButtonText}>Continuar verificacion</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleLogout}>
              <Text style={styles.secondaryButtonText}>Usar otra cuenta</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleGoogle}>
              <Text style={styles.primaryButtonText}>Registrarse / iniciar con Google</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/(auth)/register')}>
              <Text style={styles.secondaryButtonText}>Registrarse con email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.linkButton} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.linkText}>Ya tengo cuenta</Text>
            </TouchableOpacity>
          </>
        )}

        <View style={styles.featureList}>
          <Feature text="Alta con nombre, DNI y fecha de nacimiento" />
          <Feature text="Verificacion con DNI, OTP por SMS y selfie" />
          <Feature text="Ingreso y salida fisica mediante QR" />
          <Feature text="Pago con Mercado Pago, tarjeta o expensas" />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureDot} />
      <Text style={styles.featureText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    paddingTop: Spacing.xxl,
    gap: Spacing.md,
  },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.lg,
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  title: {
    fontSize: 36,
    color: Colors.text,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 24,
    maxWidth: 340,
  },
  panel: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.md,
  },
  panelTitle: {
    fontSize: FontSizes.lg,
    color: Colors.text,
    fontWeight: '800',
  },
  pendingCard: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 4,
  },
  pendingLabel: {
    color: Colors.warning,
    fontSize: FontSizes.xs,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  pendingText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  pendingHint: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  primaryButton: {
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
  featureList: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  featureRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
  featureText: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
});
