import { useEffect, useState } from 'react';
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';
import {
  getGoogleAuthUrl,
  getGoogleRedirectUri,
  hydrateInviteContext,
  resolveNeighborhoodInvite,
  setInviteContext,
} from '../../services/api';
import { useAuthStore } from '../../services/authStore';
import { getVerificationRoute, requiresIdentityVerification } from '../../services/verificationFlow';

export default function WelcomeScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isCompact = width < 430;
  const params = useLocalSearchParams<{ invite_code?: string; invite_token?: string }>();
  const { isAuthenticated, user, logout } = useAuthStore();
  const [inviteValue, setInviteValue] = useState('');
  const [resolvingInvite, setResolvingInvite] = useState(true);
  const [inviteReady, setInviteReady] = useState(false);
  const [resolvedNeighborhood, setResolvedNeighborhood] = useState('');

  useEffect(() => {
    const bootstrapInvite = async () => {
      const deepLinkInvite = params.invite_token || params.invite_code;

      if (typeof deepLinkInvite === 'string' && deepLinkInvite.trim()) {
        setInviteValue(deepLinkInvite.trim());
        await handleResolveInvite(deepLinkInvite.trim());
        return;
      }

      const stored = await hydrateInviteContext();
      if (stored?.neighborhoodName) {
        setInviteReady(true);
        setResolvedNeighborhood(stored.neighborhoodName);
        setInviteValue(stored.inviteToken || stored.inviteCode || '');
      }

      setResolvingInvite(false);
    };

    void bootstrapInvite();
  }, [params.invite_code, params.invite_token]);

  const isPendingVerification =
    isAuthenticated && requiresIdentityVerification(user) && user?.verification_status !== 'verified';

  const handleGoogle = async () => {
    if (!inviteReady) {
      Alert.alert('Invitacion requerida', 'Primero valida tu codigo o link de invitacion.');
      return;
    }

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

  const handleResolveInvite = async (rawValue = inviteValue) => {
    const normalized = rawValue.trim();
    if (!normalized) {
      Alert.alert('Invitacion requerida', 'Ingresa el codigo o pega el link de invitacion.');
      setResolvingInvite(false);
      return;
    }

    setResolvingInvite(true);
    try {
      const extracted = normalized.includes('invite_token=')
        ? new URL(normalized).searchParams.get('invite_token') || normalized
        : normalized.includes('invite_code=')
          ? new URL(normalized).searchParams.get('invite_code') || normalized
          : normalized;
      const res = await resolveNeighborhoodInvite(extracted);
      const data = res.data.data;

      await setInviteContext({
        inviteCode: data.invite.code,
        inviteToken: data.invite.token,
        neighborhoodName: data.neighborhood.name,
        neighborhoodSlug: data.neighborhood.slug,
        inviteType: data.invite.type,
        invitedEmail: data.invited_email,
        lotId: data.lot?.id,
        lotCode: data.lot?.code,
        lotName: data.lot?.name,
      });

      setInviteReady(true);
      setResolvedNeighborhood(data.neighborhood.name);
      setInviteValue(extracted);
    } catch (error: any) {
      setInviteReady(false);
      setResolvedNeighborhood('');
      Alert.alert('Invitacion invalida', error?.response?.data?.error || 'No pudimos validar tu invitacion.');
    } finally {
      setResolvingInvite(false);
    }
  };

  return (
    <ScreenWrapper backgroundColor={Colors.background}>
      <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, isWide && styles.wideCard]}>
          <BrandMark
            size="lg"
            subtitle="Un mercado de confianza, disponible dentro de tu barrio para entrar, comprar y salir con total calma."
          />
          <View style={styles.heroMetrics}>
            <HeroPill label="Invitacion" value="Controlada" />
            <HeroPill label="Acceso" value="QR" />
            <HeroPill label="Pago" value="Simple" />
          </View>
        </View>

        <Card variant="elevated" style={[styles.infoCard, isWide && styles.wideCard]}>
          <Text style={styles.eyebrow}>Ingreso guiado</Text>
          <Text style={[styles.title, isCompact && styles.titleCompact]}>Tu experiencia empieza con una invitacion valida.</Text>
          <Text style={styles.subtitle}>
            Market House resuelve el barrio desde tu link o codigo. Una vez validado, el barrio queda fijo para proteger el acceso y el lote.
          </Text>
        </Card>

        {isPendingVerification ? (
          <Card variant="elevated" style={[styles.panel, isWide && styles.wideCard]}>
            <View style={styles.panelHeader}>
              <View style={styles.panelIcon}>
                <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
              </View>
              <View style={styles.panelCopy}>
                <Text style={styles.panelTitle}>Tu cuenta ya existe</Text>
                <Text style={styles.panelDescription}>
                  {user?.email || 'Esta cuenta'} necesita completar telefono, documento y selfie antes de entrar.
                </Text>
              </View>
            </View>
            <Button label="Continuar verificacion" onPress={handleContinueVerification} />
            <Button label="Usar otra cuenta" variant="outline" onPress={handleUseAnotherAccount} />
          </Card>
        ) : (
          <Card variant="elevated" style={[styles.panel, isWide && styles.wideCard]}>
            <Input
              label="Codigo o link de invitacion"
              value={inviteValue}
              onChangeText={setInviteValue}
              placeholder="Pega tu codigo o enlace"
            />

            {inviteReady ? (
              <View style={styles.inviteOk}>
                <Ionicons name="checkmark-circle" size={18} color={Colors.successDark} />
                <Text style={styles.inviteOkText}>{resolvedNeighborhood}</Text>
              </View>
            ) : null}

            <Button
              label={resolvingInvite ? 'Validando invitacion...' : inviteReady ? 'Invitacion validada' : 'Validar invitacion'}
              onPress={() => void handleResolveInvite()}
              loading={resolvingInvite}
            />
            <Button
              label="Ingresar con Google"
              onPress={handleGoogle}
              disabled={!inviteReady || resolvingInvite}
            />
            <Button
              label="Crear cuenta con email"
              variant="outline"
              onPress={() => router.push('/(auth)/register')}
              disabled={!inviteReady || resolvingInvite}
            />
            <TouchableOpacity
              style={styles.secondaryLink}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.secondaryLinkText}>Ya tengo cuenta, iniciar sesion</Text>
            </TouchableOpacity>
          </Card>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

function HeroPill({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.heroPill}>
      <Text style={styles.heroPillValue}>{value}</Text>
      <Text style={styles.heroPillLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  contentWide: {
    alignItems: 'center',
  },
  hero: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
  },
  heroMetrics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  heroPill: {
    minWidth: 96,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMuted,
    gap: 2,
  },
  heroPillValue: {
    color: Colors.primary,
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.md,
  },
  heroPillLabel: {
    color: Colors.primarySoft,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
  },
  infoCard: {
    gap: Spacing.sm,
    width: '100%',
  },
  eyebrow: {
    color: Colors.primarySoft,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: FontWeights.bold,
  },
  title: {
    ...Typography.h1,
    fontSize: 34,
  },
  titleCompact: {
    fontSize: 30,
    lineHeight: 38,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  panel: {
    padding: Spacing.lg,
    gap: Spacing.md,
    width: '100%',
  },
  panelHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    alignItems: 'flex-start',
  },
  panelIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primarySoftest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panelCopy: {
    flex: 1,
    gap: Spacing.xs,
  },
  panelTitle: {
    ...Typography.h3,
    fontSize: FontSizes.xl,
  },
  panelDescription: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  secondaryLink: {
    alignSelf: 'center',
    paddingTop: Spacing.xs,
  },
  secondaryLinkText: {
    color: Colors.primary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  inviteOk: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.successLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
  },
  inviteOkText: {
    color: Colors.successDark,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  wideCard: {
    width: '100%',
    maxWidth: 920,
  },
});
