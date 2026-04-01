import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';

import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';
import { getInviteContext, hydrateInviteContext, validateOnboardingLot } from '../../services/api';
import { useAuthStore } from '../../services/authStore';

export default function RegisterScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isCompact = width < 430;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [inviteReady, setInviteReady] = useState(false);
  const [neighborhoodName, setNeighborhoodName] = useState('');
  const [inviteType, setInviteType] = useState<'neighborhood' | 'lot_member'>('neighborhood');
  const [prefilledLotId, setPrefilledLotId] = useState('');
  const [prefilledLotName, setPrefilledLotName] = useState('');
  const [prefilledEmail, setPrefilledEmail] = useState('');
  const { register } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dni, setDni] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [lotId, setLotId] = useState('');
  const [activationCode, setActivationCode] = useState('');

  useEffect(() => {
    const loadInvite = async () => {
      const stored = getInviteContext() || await hydrateInviteContext();
      if (!stored?.neighborhoodName) {
        router.replace('/(auth)/welcome');
        return;
      }

      setInviteReady(true);
      setNeighborhoodName(stored.neighborhoodName);
      setInviteType(stored.inviteType || 'neighborhood');
      setPrefilledLotId(stored.lotCode || stored.lotId?.toString() || '');
      setPrefilledLotName(stored.lotName || stored.lotCode || '');
      setPrefilledEmail(stored.invitedEmail || '');
      if (stored.invitedEmail) setEmail(stored.invitedEmail);
    };

    void loadInvite();
  }, []);

  const handleStep1 = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Datos incompletos', 'Completa los campos del primer paso.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Contrasenas distintas', 'La confirmacion no coincide.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contrasena corta', 'Usa al menos 6 caracteres.');
      return;
    }

    setStep(2);
  };

  const handleRegister = async () => {
    const resolvedLotId = inviteType === 'lot_member' ? prefilledLotId : lotId.trim();

    if (!dni || !birthDate || !phone || !resolvedLotId) {
      Alert.alert('Datos incompletos', 'Completa DNI, fecha de nacimiento, telefono y lote.');
      return;
    }

    if (dni.trim().length < 7 || dni.trim().length > 10) {
      Alert.alert('DNI invalido', 'El DNI debe tener entre 7 y 10 digitos.');
      return;
    }

    setLoading(true);
    try {
      if (inviteType !== 'lot_member') {
        await validateOnboardingLot(resolvedLotId, activationCode.trim() || undefined);
      }

      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        dni: dni.trim(),
        birth_date: birthDate.trim(),
        phone: phone.trim(),
        lot_id: resolvedLotId,
        activation_code: inviteType === 'lot_member' ? undefined : activationCode.trim() || undefined,
      });

      router.replace('/(auth)/pending-access' as any);
    } catch (error: any) {
      Alert.alert('No pudimos crear la cuenta', error?.response?.data?.error || 'Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={[styles.scroll, isWide && styles.scrollWide]} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => (step === 2 ? setStep(1) : router.back())}>
            <Text style={styles.backText}>{step === 2 ? 'Anterior' : 'Volver'}</Text>
          </TouchableOpacity>

          <Card variant="elevated" style={[styles.heroCard, isWide && styles.wideCard]}>
            <BrandMark
              align="center"
              size="md"
              subtitle={step === 1
                ? `Tu cuenta quedara asociada a ${neighborhoodName || 'tu barrio'} desde el primer paso.`
                : 'Ahora validamos identidad y lote para evitar ingresos arbitrarios.'}
            />
          </Card>

          <View style={[styles.header, isWide && styles.wideCard]}>
            <Text style={styles.stepText}>Paso {step} de 2</Text>
            <Text style={[styles.title, isCompact && styles.titleCompact]}>{step === 1 ? 'Crear tu cuenta' : 'Validar lote y acceso'}</Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Completamos tu perfil personal antes de confirmar el lote con el que ingresas.'
                : 'Este paso protege la operacion del barrio y deja tu onboarding listo para continuar.'}
            </Text>
          </View>

          <View style={[styles.progress, isWide && styles.wideCard]}>
            <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>

          <Card variant="elevated" style={[styles.formCard, isWide && styles.wideCard]}>
            {step === 1 ? (
              <>
                <Input label="Nombre completo" value={name} onChangeText={setName} placeholder="Juan Perez" />
                <Input label="Email" value={email} onChangeText={setEmail} placeholder="tu@email.com" keyboardType="email-address" disabled={!!prefilledEmail} />
                <Input label="Contrasena" value={password} onChangeText={setPassword} placeholder="Minimo 6 caracteres" secureTextEntry />
                <Input label="Confirmar contrasena" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repite la contrasena" secureTextEntry />
                <Button label="Continuar" onPress={handleStep1} disabled={!inviteReady} />
              </>
            ) : (
              <>
                <Input label="DNI" value={dni} onChangeText={setDni} placeholder="12345678" keyboardType="number-pad" />
                <Input label="Fecha de nacimiento" value={birthDate} onChangeText={setBirthDate} placeholder="1990-05-20" />
                <Input label="Telefono" value={phone} onChangeText={setPhone} placeholder="+54 9 11 1234-5678" keyboardType="phone-pad" />
                {inviteType === 'lot_member' ? (
                  <Card variant="flat" style={styles.noticeCard}>
                    <Text style={styles.noticeTitle}>Invitacion del lote validada</Text>
                    <Text style={styles.noticeText}>
                      Esta cuenta quedara asociada a {prefilledLotName || prefilledLotId || 'tu lote'} sin volver a pedir el codigo del barrio.
                    </Text>
                  </Card>
                ) : (
                  <>
                    <Input label="Lote" value={lotId} onChangeText={setLotId} placeholder="Ej: LOT-001" />
                    <Input label="Codigo de activacion" value={activationCode} onChangeText={setActivationCode} placeholder="Opcional si tu lote lo requiere" />
                  </>
                )}
                <Card variant="flat" style={styles.noticeCard}>
                  <Text style={styles.noticeTitle}>Validacion protegida</Text>
                  <Text style={styles.noticeText}>
                    El backend valida tu lote dentro del barrio antes de habilitar el resto del onboarding.
                  </Text>
                </Card>
                <Button label="Crear cuenta" onPress={handleRegister} loading={loading} disabled={!inviteReady} />
              </>
            )}
          </Card>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.linkText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
    flexGrow: 1,
  },
  scrollWide: {
    alignItems: 'center',
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
  },
  header: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  stepText: {
    color: Colors.primarySoft,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
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
  progress: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMuted,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.accentDark,
    borderRadius: BorderRadius.full,
  },
  formCard: {
    gap: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.lg,
    width: '100%',
  },
  noticeCard: {
    gap: 6,
    backgroundColor: Colors.surfaceMuted,
  },
  noticeTitle: {
    ...Typography.h3,
    fontSize: FontSizes.lg,
  },
  noticeText: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
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
