import { useEffect, useRef } from 'react';
import {
  Alert,
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontSizes, FontWeights, Shadows, Spacing } from '../../constants/theme';
import { getGoogleAuthUrl, getGoogleRedirectUri } from '../../services/api';
import { useAuthStore } from '../../services/authStore';
import { getVerificationRoute, requiresIdentityVerification } from '../../services/verificationFlow';

export default function WelcomeScreen() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const orbOne = useRef(new Animated.Value(0)).current;
  const orbTwo = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(orbOne, { toValue: 1, duration: 4200, useNativeDriver: true }),
          Animated.timing(orbOne, { toValue: 0, duration: 4200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(orbTwo, { toValue: 1, duration: 5200, useNativeDriver: true }),
          Animated.timing(orbTwo, { toValue: 0, duration: 5200, useNativeDriver: true }),
        ]),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [orbOne, orbTwo]);

  const isPendingVerification =
    isAuthenticated && requiresIdentityVerification(user) && user?.verification_status !== 'verified';

  const handleGoogle = async () => {
    if (Platform.OS === 'web') {
      window.location.assign(getGoogleAuthUrl());
      return;
    }

    const redirectUri = getGoogleRedirectUri();
    await WebBrowser.openAuthSessionAsync(getGoogleAuthUrl(), redirectUri);
  };

  const handleContinueVerification = () => {
    router.push(getVerificationRoute(user) as any);
  };

  const handleUseAnotherAccount = async () => {
    await logout();
    router.replace('/(auth)/welcome');
  };

  return (
    <ScreenWrapper backgroundColor={Colors.background}>
      <View style={styles.canvas}>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.orb,
            styles.orbPrimary,
            {
              transform: [
                {
                  translateY: orbOne.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 18],
                  }),
                },
                {
                  translateX: orbOne.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -12],
                  }),
                },
              ],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.orb,
            styles.orbSecondary,
            {
              transform: [
                {
                  translateY: orbTwo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20],
                  }),
                },
                {
                  translateX: orbTwo.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 16],
                  }),
                },
              ],
            },
          ]}
        />

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroCard}>
            <View style={styles.brandRow}>
              <View style={styles.brandBadge}>
                <Ionicons name="bag-handle-outline" size={20} color={Colors.textInverse} />
              </View>
              <Text style={styles.brandText}>Rapid Inn Market</Text>
            </View>

            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Compra, acceso y pago en una sola app</Text>
              <Text style={styles.heroTitle}>Una experiencia mas agil, segura y moderna para tu local.</Text>
              <Text style={styles.heroSubtitle}>
                Registrate con email, continua tu verificacion cuando quieras y usa QR para entrar y salir.
              </Text>
            </View>

            <View style={styles.metricsRow}>
              <View style={styles.metricPill}>
                <Text style={styles.metricValue}>QR</Text>
                <Text style={styles.metricLabel}>Acceso fisico</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricValue}>OTP</Text>
                <Text style={styles.metricLabel}>Telefono seguro</Text>
              </View>
              <View style={styles.metricPill}>
                <Text style={styles.metricValue}>1 app</Text>
                <Text style={styles.metricLabel}>Compra y pago</Text>
              </View>
            </View>
          </View>

          {isPendingVerification ? (
            <Card variant="elevated" style={styles.panel}>
              <View style={styles.panelHeader}>
                <View style={[styles.statusIcon, styles.pendingIcon]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.panelCopy}>
                  <Text style={styles.panelTitle}>Tu cuenta ya existe</Text>
                  <Text style={styles.panelDescription}>
                    {user?.email || 'Esta cuenta'} necesita completar DNI, telefono y selfie antes de entrar.
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Button label="Continuar verificacion" onPress={handleContinueVerification} />
                <Button label="Usar otra cuenta" variant="outline" onPress={handleUseAnotherAccount} />
              </View>
            </Card>
          ) : (
            <Card variant="elevated" style={styles.panel}>
              <View style={styles.panelHeader}>
                <View style={styles.statusIcon}>
                  <Ionicons name="sparkles-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.panelCopy}>
                  <Text style={styles.panelTitle}>Empeza en segundos</Text>
                  <Text style={styles.panelDescription}>
                    Elegi el metodo de acceso que prefieras y completa tu cuenta desde la app.
                  </Text>
                </View>
              </View>

              <View style={styles.actions}>
                <Button label="Registrarse / iniciar con Google" onPress={handleGoogle} />
                <Button label="Crear cuenta con email" variant="outline" onPress={() => router.push('/(auth)/register')} />
              </View>

              <TouchableOpacity style={styles.secondaryLink} onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.secondaryLinkText}>Ya tengo cuenta, iniciar sesion</Text>
              </TouchableOpacity>
            </Card>
          )}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  canvas: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  orb: {
    position: 'absolute',
    borderRadius: BorderRadius.full,
    opacity: 0.9,
  },
  orbPrimary: {
    top: -40,
    right: -60,
    width: 180,
    height: 180,
    backgroundColor: '#D9DBFF',
  },
  orbSecondary: {
    bottom: 120,
    left: -70,
    width: 220,
    height: 220,
    backgroundColor: '#D9F6F7',
  },
  heroCard: {
    backgroundColor: Colors.primaryDarker,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    overflow: 'hidden',
    ...Shadows.lg,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  brandBadge: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  brandText: {
    color: Colors.textInverse,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  heroCopy: {
    gap: Spacing.sm,
  },
  heroEyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  heroTitle: {
    color: Colors.textInverse,
    fontSize: FontSizes.display,
    fontWeight: FontWeights.extrabold,
    lineHeight: 44,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: FontSizes.md,
    lineHeight: 24,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metricPill: {
    minWidth: 92,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    gap: 2,
  },
  metricValue: {
    color: Colors.textInverse,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  metricLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSizes.xs,
  },
  panel: {
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  statusIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  pendingIcon: {
    backgroundColor: '#EEF2FF',
  },
  panelCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  panelTitle: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
  },
  panelDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    lineHeight: 22,
  },
  actions: {
    gap: Spacing.sm,
  },
  secondaryLink: {
    alignSelf: 'center',
    paddingTop: Spacing.xs,
  },
  secondaryLinkText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
