import { useEffect } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontSizes, FontWeights, Shadows, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../services/authStore';

export default function ProfileScreen() {
  const { logout, refreshUser, user } = useAuthStore();

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const verificationVariant =
    user?.verification_status === 'verified'
      ? 'verified'
      : user?.verification_status === 'pending'
        ? 'pending'
        : 'unverified';

  const handleLogout = () => {
    const doLogout = async () => {
      await logout();
      router.replace('/(auth)/welcome');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Tu sesion actual se cerrara en este dispositivo.')) {
        void doLogout();
      }
      return;
    }

    Alert.alert('Cerrar sesion', 'Tu sesion actual se cerrara en este dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => {
          void doLogout();
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0)?.toUpperCase() || 'R'}</Text>
          </View>
          <Text style={styles.heroName}>{user?.name || 'Rapid Inn'}</Text>
          <Text style={styles.heroEmail}>{user?.email || ''}</Text>
          <Badge variant={verificationVariant} label={user?.verification_status || 'unverified'} />
        </View>

        <Card variant="elevated">
          <Text style={styles.sectionTitle}>Estado de cuenta</Text>
          <View style={styles.metricGrid}>
            <InfoStat label="Rol" value={user?.role === 'admin' ? 'Admin' : 'Cliente'} />
            <InfoStat label="DNI" value={user?.dni || 'Pendiente'} />
            <InfoStat label="Telefono" value={user?.phone || 'Pendiente'} />
            <InfoStat label="Verificada" value={user?.verification_status === 'verified' ? 'Si' : 'No'} />
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Acciones rapidas</Text>
          <ActionRow
            icon="qr-code-outline"
            title="Acceso QR"
            subtitle="Abre la camara para ingresar o salir del local."
            onPress={() => router.push('/(app)/qr-access')}
          />
          <ActionRow
            icon="card-outline"
            title="Metodos de pago"
            subtitle="Revisa el flujo completo de checkout y validacion."
            onPress={() => router.push('/(app)/cart')}
          />
          <ActionRow
            icon="shield-checkmark-outline"
            title="Verificacion de identidad"
            subtitle="Completa o revisa tus pasos de validacion."
            onPress={() => router.push('/(auth)/verify-doc')}
          />
        </Card>

        <Card variant="flat" style={styles.infoCard}>
          <Text style={styles.infoTitle}>Experiencia premium</Text>
          <Text style={styles.infoText}>
            La app ahora usa un lenguaje visual consistente: cards suaves, jerarquia tipografica clara y feedback inmediato.
          </Text>
        </Card>

        <Button label="Cerrar sesion" variant="danger" onPress={handleLogout} />
      </ScrollView>
    </ScreenWrapper>
  );
}

function InfoStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

function ActionRow({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.actionRow} onPress={onPress}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <View style={styles.actionBody}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.md,
  },
  hero: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.primaryGlow,
  },
  avatar: {
    width: 82,
    height: 82,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: FontWeights.extrabold,
  },
  heroName: {
    color: '#fff',
    fontSize: FontSizes.xxxl,
    fontWeight: FontWeights.extrabold,
  },
  heroEmail: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: FontSizes.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.extrabold,
    marginBottom: Spacing.md,
  },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 6,
  },
  statLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
  },
  statValue: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  actionSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: Colors.secondaryLight,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.extrabold,
    marginBottom: 6,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 22,
  },
});
