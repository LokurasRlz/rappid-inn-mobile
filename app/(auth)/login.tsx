import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';

import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';
import {
  getGoogleAuthUrl,
  getGoogleRedirectUri,
  getInviteContext,
  hydrateInviteContext,
  resolveNeighborhoodInvite,
  setInviteContext,
} from '../../services/api';
import { useAuthStore } from '../../services/authStore';
import { getVerificationRoute } from '../../services/verificationFlow';

export default function LoginScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [inviteValue, setInviteValue] = useState('');
  const [resolvingInvite, setResolvingInvite] = useState(false);
  const [neighborhoodName, setNeighborhoodName] = useState('');
  const { login } = useAuthStore();

  useEffect(() => {
    const loadInvite = async () => {
      const stored = getInviteContext() || await hydrateInviteContext();
      if (!stored?.neighborhoodName) {
        return;
      }

      setNeighborhoodName(stored.neighborhoodName);
      setInviteValue(stored.inviteToken || stored.inviteCode || '');
    };

    void loadInvite();
  }, []);

  const handleResolveInvite = async () => {
    const normalized = inviteValue.trim();
    if (!normalized) {
      Alert.alert('Invitacion requerida', 'Ingresa tu codigo o link de invitacion para continuar.');
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

      setNeighborhoodName(data.neighborhood.name);
      setInviteValue(extracted);
    } catch (error: any) {
      setNeighborhoodName('');
      Alert.alert('Invitacion invalida', error?.response?.data?.error || 'No pudimos validar tu invitacion.');
    } finally {
      setResolvingInvite(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Datos incompletos', 'Ingresa email y contrasena para continuar.');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      router.replace(getVerificationRoute(useAuthStore.getState().user) as any);
    } catch (error: any) {
      Alert.alert('No pudimos iniciar sesion', error?.response?.data?.error || 'Revisa tus credenciales.');
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
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={[styles.content, isWide && styles.contentWide]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>

          <Card variant="elevated" style={[styles.heroCard, isWide && styles.wideCard]}>
            <BrandMark
              align="center"
              size="md"
              subtitle={neighborhoodName
                ? `Ingresa para seguir operando en ${neighborhoodName || 'tu barrio'} con acceso QR, compra y salida simple.`
                : 'Si ya tienes cuenta, entra directo con tu email, tu contrasena o Google. La invitacion queda solo para crear cuentas nuevas.'}
            />
          </Card>

          {!neighborhoodName ? (
            <Card variant="elevated" style={[styles.formCard, isWide && styles.wideCard]}>
              <View style={styles.copyBlock}>
                <Text style={styles.title}>Tienes un codigo del barrio?</Text>
                <Text style={styles.subtitle}>Solo lo necesitas para crear una cuenta nueva o validar una invitacion del lote.</Text>
              </View>
              <Input
                label="Codigo o link de invitacion"
                value={inviteValue}
                onChangeText={setInviteValue}
                placeholder="Ej: MARKETHOUSEMAIN"
              />
              <Button label="Validar invitacion" onPress={handleResolveInvite} loading={resolvingInvite} />
            </Card>
          ) : null}

          <Card variant="elevated" style={[styles.formCard, isWide && styles.wideCard]}>
            <View style={styles.copyBlock}>
              <Text style={styles.title}>Bienvenido de nuevo</Text>
              <Text style={styles.subtitle}>
                {neighborhoodName
                  ? 'Tu barrio ya quedo validado. Solo falta entrar con tu cuenta.'
                  : 'Si tu cuenta ya existe, puedes iniciar sesion normalmente sin volver a pedir un codigo.'}
              </Text>
            </View>

            <Input label="Email" value={email} onChangeText={setEmail} placeholder="nombre@email.com" keyboardType="email-address" />
            <Input label="Contrasena" value={password} onChangeText={setPassword} placeholder="********" secureTextEntry />

            <Button label="Iniciar sesion" onPress={handleLogin} loading={loading} />
            <Button label="Continuar con Google" variant="outline" onPress={handleGoogle} />
          </Card>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.linkText}>Crear cuenta con email</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboard: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
    paddingBottom: Spacing.xxl,
    justifyContent: 'center',
    flexGrow: 1,
  },
  contentWide: {
    alignItems: 'center',
  },
  container: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  backText: {
    color: Colors.primary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
    maxWidth: 920,
    width: '100%',
    alignSelf: 'center',
  },
  formCard: {
    gap: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.lg,
    maxWidth: 920,
    width: '100%',
    alignSelf: 'center',
  },
  copyBlock: {
    gap: Spacing.xs,
  },
  title: {
    ...Typography.h2,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    alignSelf: 'center',
  },
  linkText: {
    color: Colors.primary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  wideCard: {
    width: '100%',
    maxWidth: 920,
  },
});
