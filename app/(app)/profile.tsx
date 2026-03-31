import { useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../services/authStore';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuthStore();

  useEffect(() => {
    refreshUser();
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/welcome');
        },
      },
    ]);
  };

  const verificationStatus = user?.verification_status ?? 'unverified';
  const verificationConfig = {
    verified: {
      label: 'Verificado',
      icon: '✅',
      color: Colors.success,
      bg: Colors.successLight,
      action: null,
    },
    pending: {
      label: 'En revisión',
      icon: '⏳',
      color: Colors.warning,
      bg: Colors.warningLight,
      action: null,
    },
    unverified: {
      label: 'Sin verificar',
      icon: '🔐',
      color: Colors.textMuted,
      bg: Colors.borderLight,
      action: 'Verificar ahora →',
    },
  }[verificationStatus];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.inner} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.name}>{user?.name ?? 'Usuario'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>

          {/* Verification badge */}
          <TouchableOpacity
            style={[styles.verificationBadge, { backgroundColor: verificationConfig.bg }]}
            onPress={
              verificationStatus === 'unverified'
                ? () => router.push('/(auth)/verify-doc')
                : undefined
            }
          >
            <Text>{verificationConfig.icon}</Text>
            <Text style={[styles.verificationLabel, { color: verificationConfig.color }]}>
              {verificationConfig.label}
            </Text>
            {verificationConfig.action && (
              <Text style={[styles.verificationAction, { color: verificationConfig.color }]}>
                {verificationConfig.action}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Info section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información</Text>
          <View style={styles.card}>
            <InfoRow icon="📧" label="Email" value={user?.email ?? '—'} />
            <InfoRow icon="📱" label="Teléfono" value={user?.phone ?? '—'} />
            <InfoRow icon="🪪" label="DNI" value={user?.dni ?? '—'} />
            <InfoRow icon="👤" label="Rol" value={user?.role === 'admin' ? 'Administrador' : 'Cliente'} last />
          </View>
        </View>

        {/* Verification section */}
        {verificationStatus !== 'verified' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Verificación de identidad</Text>
            <View style={styles.verifyCard}>
              <Text style={styles.verifyCardTitle}>
                {verificationStatus === 'pending'
                  ? '⏳ Verificación en proceso'
                  : '🔐 Completá tu verificación'}
              </Text>
              <Text style={styles.verifyCardText}>
                {verificationStatus === 'pending'
                  ? 'Estamos revisando tus documentos. Te notificaremos en 24-48hs.'
                  : 'Para acceder a la tienda con QR necesitás verificar tu identidad con foto de DNI y selfie.'}
              </Text>
              {verificationStatus === 'unverified' && (
                <TouchableOpacity
                  style={styles.verifyCardBtn}
                  onPress={() => router.push('/(auth)/verify-doc')}
                >
                  <Text style={styles.verifyCardBtnText}>Iniciar verificación →</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acciones</Text>
          <View style={styles.card}>
            <ActionRow
              icon="📲"
              label="Acceso QR a la tienda"
              onPress={() => router.push('/(app)/qr-access')}
            />
            <ActionRow
              icon="📦"
              label="Mis pedidos"
              onPress={() => Alert.alert('Próximamente', 'Historial de pedidos en desarrollo')}
            />
            <ActionRow
              icon="🔔"
              label="Notificaciones"
              onPress={() => Alert.alert('Próximamente', 'En desarrollo')}
              last
            />
          </View>
        </View>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutBtnText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Rapid Inn v2.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  icon, label, value, last,
}: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

function ActionRow({
  icon, label, onPress, last,
}: { icon: string; label: string; onPress: () => void; last?: boolean }) {
  return (
    <TouchableOpacity style={[styles.row, !last && styles.rowBorder]} onPress={onPress}>
      <Text style={styles.rowIcon}>{icon}</Text>
      <Text style={[styles.rowValue, { flex: 1 }]}>{label}</Text>
      <Text style={{ color: Colors.textMuted }}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  header: { alignItems: 'center', paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    ...Shadows.lg,
  },
  avatarText: { fontSize: FontSizes.xxxl, fontWeight: '800', color: '#fff' },
  name: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.text, marginTop: Spacing.md },
  email: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  verificationBadge: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: 8,
    marginTop: Spacing.md,
  },
  verificationLabel: { fontSize: FontSizes.sm, fontWeight: '700' },
  verificationAction: { fontSize: FontSizes.sm, fontWeight: '700' },
  section: { marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSizes.md, fontWeight: '700', color: Colors.textSecondary,
    marginBottom: Spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5,
  },
  card: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', ...Shadows.sm,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md, gap: Spacing.md,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowLabel: { fontSize: FontSizes.xs, color: Colors.textMuted, marginBottom: 2 },
  rowValue: { fontSize: FontSizes.md, fontWeight: '600', color: Colors.text },
  verifyCard: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, borderWidth: 1,
    borderColor: Colors.warning + '60', ...Shadows.sm,
  },
  verifyCardTitle: { fontSize: FontSizes.md, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  verifyCardText: { fontSize: FontSizes.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  verifyCardBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 12, alignItems: 'center',
  },
  verifyCardBtnText: { color: '#fff', fontWeight: '700' },
  logoutBtn: {
    borderWidth: 1.5, borderColor: Colors.danger, borderRadius: BorderRadius.md,
    paddingVertical: 14, alignItems: 'center',
  },
  logoutBtnText: { color: Colors.danger, fontSize: FontSizes.md, fontWeight: '700' },
  version: {
    textAlign: 'center', color: Colors.textMuted,
    fontSize: FontSizes.xs, marginTop: Spacing.lg,
  },
});
