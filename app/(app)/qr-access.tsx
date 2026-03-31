import { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router, useLocalSearchParams } from 'expo-router';

import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../services/authStore';
import { DoorMode, validateStoreQr } from '../../services/api';

type AccessState = 'idle' | 'scanning' | 'success' | 'error';

const LOCATION_OPTIONS = ['Entrada principal', 'Hall Norte', 'Salida principal'];

export default function QrAccessScreen() {
  const params = useLocalSearchParams<{ mode?: string; orderId?: string }>();
  const mode: DoorMode = params.mode === 'exit' ? 'exit' : 'entry';
  const orderId = params.orderId ? Number(params.orderId) : undefined;

  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<AccessState>('idle');
  const [message, setMessage] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(LOCATION_OPTIONS[0]);
  const [locked, setLocked] = useState(false);
  const { user } = useAuthStore();

  const isVerified = user?.role === 'admin' || user?.verification_status === 'verified';
  const title = useMemo(
    () => (mode === 'exit' ? 'Salida con QR' : 'Ingreso con QR'),
    [mode],
  );

  const handleQrScan = async ({ data }: { data: string }) => {
    if (locked) return;

    setLocked(true);
    setState('scanning');
    setMessage(mode === 'exit' ? 'Validando salida...' : 'Validando acceso...');

    try {
      await validateStoreQr(mode, data, orderId, selectedLocation);
      setState('success');
      setMessage(mode === 'exit' ? 'Salida autorizada. Puerta desbloqueada.' : 'Ingreso autorizado. Puerta desbloqueada.');
    } catch (error: any) {
      setState('error');
      setMessage(error?.response?.data?.error || 'No se pudo validar el QR.');
    } finally {
      setTimeout(() => {
        setLocked(false);
        setState('idle');
        setMessage('');
      }, 3500);
    }
  };

  if (!isVerified) {
    return (
      <SafeAreaView style={styles.blockedContainer}>
        <View style={styles.blockedCard}>
          <Text style={styles.blockedTitle}>Cuenta sin verificar</Text>
          <Text style={styles.blockedText}>
            Necesitas completar DNI, OTP y selfie antes de usar el acceso fisico.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={() => router.push('/(auth)/verify-doc')}>
            <Text style={styles.primaryButtonText}>Completar verificacion</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.blockedContainer}>
        <View style={styles.blockedCard}>
          <Text style={styles.blockedTitle}>Permiso de camara</Text>
          <Text style={styles.blockedText}>
            Necesitamos la camara para leer el QR del local.
          </Text>
          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>Permitir camara</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={state === 'idle' ? handleQrScan : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.headerAction}>Volver</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{title}</Text>
            <View style={{ width: 50 }} />
          </View>

          <View style={styles.centerArea}>
            <View style={styles.frame} />
            <Text style={styles.hint}>
              {mode === 'exit'
                ? 'Escanea el QR de salida para habilitar la puerta'
                : 'Escanea el QR del local para abrir la puerta'}
            </Text>
          </View>

          <View style={styles.bottomSheet}>
            <Text style={styles.bottomTitle}>Ubicacion del acceso</Text>
            <View style={styles.locationRow}>
              {LOCATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.locationChip,
                    selectedLocation === option && styles.locationChipActive,
                  ]}
                  onPress={() => setSelectedLocation(option)}
                >
                  <Text
                    style={[
                      styles.locationChipText,
                      selectedLocation === option && styles.locationChipTextActive,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {message ? (
              <View
                style={[
                  styles.statusCard,
                  state === 'success' && styles.statusSuccess,
                  state === 'error' && styles.statusError,
                ]}
              >
                {state === 'scanning' && <ActivityIndicator color={Colors.primary} />}
                <Text style={styles.statusText}>{message}</Text>
              </View>
            ) : (
              <Text style={styles.helperText}>
                QR esperado: `rapid-inn:store:rapid-inn-main:{mode}`
              </Text>
            )}

            {mode === 'exit' && !orderId && (
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() =>
                  Alert.alert('Orden requerida', 'Primero completa un pago para habilitar la salida.')
                }
              >
                <Text style={styles.secondaryButtonText}>Necesitas una orden pagada</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerAction: {
    color: Colors.textInverse,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  headerTitle: {
    color: Colors.textInverse,
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  frame: {
    width: 240,
    height: 240,
    borderWidth: 3,
    borderColor: '#fff',
    borderRadius: 24,
    borderStyle: 'dashed',
  },
  hint: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },
  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  bottomTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
  },
  locationRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  locationChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.borderLight,
  },
  locationChipActive: {
    backgroundColor: Colors.primary,
  },
  locationChipText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  locationChipTextActive: {
    color: '#fff',
  },
  statusCard: {
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primaryLight,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusSuccess: {
    backgroundColor: Colors.successLight,
  },
  statusError: {
    backgroundColor: Colors.dangerLight,
  },
  statusText: {
    flex: 1,
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  helperText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  blockedContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  blockedCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    ...Shadows.md,
  },
  blockedTitle: {
    fontSize: FontSizes.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  blockedText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
});
