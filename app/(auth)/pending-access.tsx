import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { Colors, FontFamilies, FontSizes, Spacing, Typography } from '../../constants/theme';
import { useAuthStore } from '../../services/authStore';

const STATE_COPY = {
  pending_validation: {
    title: 'Validacion pendiente',
    body: 'Estamos validando el ingreso de tu lote al barrio. Te avisaremos cuando puedas continuar.',
  },
  rejected: {
    title: 'Solicitud rechazada',
    body: 'Tu ingreso no pudo ser aprobado con los datos enviados. Revisa la invitacion o contacta administracion.',
  },
  requires_action: {
    title: 'Accion requerida',
    body: 'Necesitamos datos adicionales para validar tu lote o tu invitacion antes de continuar.',
  },
} as const;

export default function PendingAccessScreen() {
  const { user, logout } = useAuthStore();
  const state = user?.onboarding_state && user.onboarding_state !== 'active'
    ? user.onboarding_state
    : 'pending_validation';
  const copy = STATE_COPY[state];

  return (
    <ScreenWrapper style={styles.container}>
      <Card variant="elevated" style={styles.card}>
        <BrandMark align="center" size="md" subtitle="Tu ingreso queda bajo control del barrio para mantener la operacion segura y ordenada." />
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.body}>{user?.onboarding_reason || copy.body}</Text>
        <Button label="Volver al inicio" onPress={() => router.replace('/(auth)/welcome')} />
        <Button label="Cerrar sesion" variant="outline" onPress={() => void logout()} />
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  card: {
    gap: Spacing.md,
    padding: Spacing.xl,
  },
  title: {
    ...Typography.h2,
    textAlign: 'center',
  },
  body: {
    fontFamily: FontFamilies.body,
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    lineHeight: 22,
    textAlign: 'center',
  },
});
