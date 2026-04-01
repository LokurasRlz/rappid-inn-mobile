import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Toast from 'react-native-toast-message';
import QRCode from 'react-native-qrcode-svg';
import Constants from 'expo-constants';

import Button from '../../components/ui/Button';
import BrandMark from '../../components/ui/BrandMark';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';
import {
  diagnoseEwelinkDevices,
  generateAccessQr,
  getDoorStatus,
  getEwelinkAuthUrl,
  getEwelinkStatus,
  openEntryDoor,
  openExitDoor,
  validateStoreQr,
} from '../../services/api';
import { useAuthStore } from '../../services/authStore';

type DoorState = 'idle' | 'opening' | 'opened' | 'error';
const CORNER_STYLES = ['cTL', 'cTR', 'cBL', 'cBR'] as const;

function resolveBackendBaseUrl() {
  const configuredApiUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined;

  if (configuredApiUrl) {
    return configuredApiUrl.replace(/\/api\/v1\/?$/, '');
  }

  return 'http://192.168.68.59:3000';
}

export default function QrAccessScreen() {
  const { width, height } = useWindowDimensions();
  const frameSize = Math.min(width < 430 ? 210 : 260, width - 72);
  const [permission, requestPermission] = useCameraPermissions();
  const [doorState, setDoorState] = useState<DoorState>('idle');
  const [scanned, setScanned] = useState(false);
  const [accessReady, setAccessReady] = useState(false);
  const [lastQrData, setLastQrData] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);
  const [storeCode, setStoreCode] = useState('market-house-main');
  const [loadingStoreCode, setLoadingStoreCode] = useState(true);
  const [showEntryQr, setShowEntryQr] = useState(false);
  const [setupUrl, setSetupUrl] = useState(`${resolveBackendBaseUrl()}/ewelink_setup`);
  const { user } = useAuthStore();
  const params = useLocalSearchParams<{ mode?: string; orderId?: string }>();
  const mode = params.mode === 'exit' ? 'exit' : 'entry';
  const exitOrderId = params.orderId ? Number(params.orderId) : undefined;

  const canOpenDoor = user?.role === 'admin' || user?.verification_status === 'verified';
  const entryQrValue = useMemo(() => `market-house:store:${storeCode}:entry`, [storeCode]);

  useEffect(() => {
    loadDoorStatus();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadEwelinkSetupUrl();
    }
  }, [user?.role]);

  const loadDoorStatus = async () => {
    try {
      const res = await getDoorStatus();
      const nextStoreCode = res?.data?.data?.store_code;

      if (typeof nextStoreCode === 'string' && nextStoreCode.trim()) {
        setStoreCode(nextStoreCode.trim());
      }
    } catch {
      // Keep fallback store code so the admin can still generate a QR in development.
    } finally {
      setLoadingStoreCode(false);
    }
  };

  const loadEwelinkSetupUrl = async () => {
    try {
      const res = await getEwelinkAuthUrl();
      const nextSetupUrl = res?.data?.data?.setup_url;

      if (typeof nextSetupUrl === 'string' && nextSetupUrl.trim()) {
        setSetupUrl(nextSetupUrl.trim());
      }
    } catch {
      // Keep fallback setup URL for local development.
    }
  };

  const checkEwelinkStatus = async () => {
    try {
      const res = await getEwelinkStatus();
      const status = res.data.data;

      if (typeof status.setup_url === 'string' && status.setup_url.trim()) {
        setSetupUrl(status.setup_url.trim());
      }

      const detail = status.token_obtained
        ? `Token OK. Fuente: ${status.token_source}. Expira: ${status.expires_at || 'sin fecha'}`
        : `Sin token. ${status.recommended_next_step || 'Completa el setup OAuth'}`;

      Toast.show({
        type: status.token_obtained ? 'success' : 'error',
        text1: 'Estado eWeLink',
        text2: detail,
        visibilityTime: 9000,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Test fallido',
        text2: error?.message || 'No se pudo consultar el estado de eWeLink',
        visibilityTime: 9000,
      });
    }
  };

  const runDeviceDiagnosis = async () => {
    try {
      const res = await diagnoseEwelinkDevices();
      const diagnosis = res.data.data;
      const entry = diagnosis?.entry?.status;
      const exit = diagnosis?.exit?.status;

      const entrySummary = entry?.success
        ? 'entrada OK'
        : `entrada fallo${entry?.error ? `: ${entry.error}` : ''}`;
      const exitSummary = exit?.success
        ? 'salida OK'
        : `salida fallo${exit?.error ? `: ${exit.error}` : ''}`;

      Toast.show({
        type: entry?.success || exit?.success ? 'success' : 'error',
        text1: 'Diagnostico del dispositivo',
        text2: `${entrySummary} | ${exitSummary}`,
        visibilityTime: 9000,
      });
    } catch (error: any) {
      Toast.show({
        type: 'error',
        text1: 'Diagnostico fallido',
        text2: error?.message || 'No se pudo consultar el estado del dispositivo',
        visibilityTime: 9000,
      });
    }
  };

  const resetDoorState = (delayMs: number) => {
    setTimeout(() => {
      setScanned(false);
      setAccessReady(false);
      setLastQrData(null);
      setAccessToken(null);
      setAccessExpiresAt(null);
      setDoorState('idle');
    }, delayMs);
  };

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || doorState !== 'idle') return;

    setScanned(true);
    setDoorState('opening');

    try {
      const generated = await generateAccessQr(mode, exitOrderId, data, `${mode}-qr-generation`);
      const token = generated.data.data.access_token as string;
      const expiresAt = generated.data.data.expires_at as string;
      await validateStoreQr(mode, token, data, exitOrderId, `${mode}-qr-scan-validation`);
      setAccessReady(true);
      setLastQrData(data);
      setAccessToken(token);
      setAccessExpiresAt(expiresAt);
      setDoorState('idle');
      Toast.show({
        type: 'success',
        text1: 'QR valido',
        text2: mode === 'exit' ? 'Salida autorizada. Ahora puedes abrir la puerta.' : 'Entrada autorizada. Ahora puedes abrir la puerta.',
      });
    } catch (error: any) {
      setDoorState('error');
      Toast.show({
        type: 'error',
        text1: 'No se pudo abrir la puerta',
        text2: error?.response?.data?.error || 'El QR no es valido o no tenes acceso',
      });
      resetDoorState(3000);
    }
  };

  const handleManualOpen = async () => {
    setDoorState('opening');

    try {
      let token = accessToken;
      if (!token) {
        const generated = await generateAccessQr(mode, exitOrderId, lastQrData || undefined, `${mode}-manual-generation`);
        token = generated.data.data.access_token as string;
        setAccessToken(token);
        setAccessExpiresAt(generated.data.data.expires_at as string);
        await validateStoreQr(mode, token, lastQrData || '', exitOrderId, `${mode}-manual-validation`);
      }

      if (mode === 'exit' && exitOrderId) {
        await openExitDoor(exitOrderId, token, lastQrData || undefined, accessReady ? 'exit-qr-button' : 'manual-exit-button');
      } else {
        await openEntryDoor(token, lastQrData || undefined, accessReady ? 'entry-qr-button' : 'manual-entry-button');
      }

      setDoorState('opened');
      Toast.show({
        type: 'success',
        text1: mode === 'exit' ? 'Salida habilitada' : 'Puerta habilitada',
        text2: 'La senal se envio al Sonoff',
      });
      resetDoorState(5000);
    } catch (error: any) {
      setDoorState('error');
      const detail = error?.response?.data?.detail;
      const message = error?.response?.data?.error || 'No se pudo enviar la senal';
      Toast.show({
        type: 'error',
        text1: 'Error al abrir la puerta',
        text2: detail ? `${message}: ${detail}` : message,
        visibilityTime: 7000,
      });
      resetDoorState(3000);
    }
  };

  if (!canOpenDoor) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
          <View style={styles.blockedContent}>
            <BrandMark align="center" size="md" />
            <View style={styles.blockedIcon}>
            <Ionicons name="lock-closed" size={48} color={Colors.textMuted} />
          </View>
          <Text style={styles.blockedTitle}>Acceso restringido</Text>
          <Text style={styles.blockedSubtitle}>
            Verifica tu identidad para abrir la puerta con QR o con el boton manual.
          </Text>
          <Button label="Verificar identidad" onPress={() => router.push('/(auth)/verify-doc')} fullWidth={false} />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
          <View style={styles.blockedContent}>
            <BrandMark align="center" size="md" />
            <Ionicons name="camera-outline" size={56} color={Colors.primary} />
          <Text style={styles.blockedTitle}>Camara necesaria</Text>
          <Text style={styles.blockedSubtitle}>
            Necesitamos acceso a la camara para leer el QR de la puerta.
          </Text>
          <Button label="Permitir camara" onPress={requestPermission} fullWidth={false} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.screen}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={doorState === 'idle' ? handleScan : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      >
        <SafeAreaView style={styles.overlay} edges={['top']}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Acceso a puerta</Text>
            <TouchableOpacity style={styles.headerAction} onPress={() => setShowEntryQr((current) => !current)}>
              <Ionicons name={showEntryQr ? 'eye-off-outline' : 'qr-code-outline'} size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={[styles.qrFrame, { width: frameSize, height: frameSize }]}>
              {CORNER_STYLES.map((cornerStyle) => (
                <View key={cornerStyle} style={[styles.corner, styles[cornerStyle]]} />
              ))}
              {doorState === 'opening' && (
                <View style={styles.loadOverlay}>
                  <ActivityIndicator color={Colors.primary} size="large" />
                </View>
              )}
              {doorState === 'opened' && (
                <View style={[styles.loadOverlay, styles.successOverlay]}>
                  <Ionicons name="checkmark-circle" size={56} color={Colors.success} />
                </View>
              )}
              {doorState === 'error' && (
                <View style={[styles.loadOverlay, styles.errorOverlay]}>
                  <Ionicons name="close-circle" size={56} color={Colors.error} />
                </View>
              )}
            </View>
            <Text style={styles.scanHint}>
              {doorState === 'idle' && !accessReady && (mode === 'exit' ? 'Escanea el QR de salida' : 'Escanea el QR de entrada')}
              {doorState === 'idle' && accessReady && (mode === 'exit' ? 'QR de salida validado. Puedes abrir la puerta' : 'QR de entrada validado. Puedes abrir la puerta')}
              {doorState === 'opening' && 'Enviando autorizacion...'}
              {doorState === 'opened' && (mode === 'exit' ? 'Salida habilitada' : 'Puerta habilitada')}
              {doorState === 'error' && 'Acceso denegado'}
            </Text>
          </View>
        </SafeAreaView>
      </CameraView>

      <View style={[styles.bottomSheet, { maxHeight: height * (width >= 960 ? 0.52 : 0.46) }]}>
        <ScrollView contentContainerStyle={styles.bottomContent} showsVerticalScrollIndicator={false}>
          <View style={styles.ctaCard}>
            <BrandMark align="center" size="md" subtitle={mode === 'exit' ? 'Salida tranquila, validada y de un solo uso.' : 'Ingreso tranquilo, validado y de un solo uso.'} />
            <Text style={styles.ctaTitle}>{mode === 'exit' ? 'Salir desde la app' : 'Abrir puerta desde la app'}</Text>
            <Text style={styles.ctaSubtitle}>
              {mode === 'exit'
                ? 'Validamos una sesion corta y de un solo uso antes de habilitar la salida por QR.'
                : 'Validamos una sesion corta y de un solo uso antes de habilitar la entrada por QR.'}
            </Text>
            {accessExpiresAt && (
              <Text style={styles.sessionHint}>Sesion valida hasta: {new Date(accessExpiresAt).toLocaleTimeString()}</Text>
            )}
            <Button
              label={doorState === 'opening' ? 'Abriendo...' : accessReady ? (mode === 'exit' ? 'Abrir salida' : 'Abrir puerta') : (mode === 'exit' ? 'Preparar salida' : 'Abrir puerta manualmente')}
              onPress={handleManualOpen}
              loading={doorState === 'opening'}
              disabled={doorState === 'opening'}
            />
            {accessReady && (
              <TouchableOpacity onPress={() => { setAccessReady(false); setScanned(false); setLastQrData(null); }}>
                <Text style={styles.resetLink}>Escanear otro QR</Text>
              </TouchableOpacity>
            )}
          </View>

          {user?.role === 'admin' && (
            <View style={styles.adminPanel}>
              <BrandMark size="md" />
              <Text style={styles.adminPanelTitle}>Panel Admin</Text>
              <Text style={styles.adminPanelHint}>
                Para conectar eWeLink abre esta URL en el navegador y completa el login una sola vez:
              </Text>
              <Text style={styles.adminPanelCode}>{setupUrl}</Text>
              <Text style={styles.adminPanelCode}>QR imprimible: {`${resolveBackendBaseUrl()}/door_qr/entry`}</Text>
              <TouchableOpacity style={styles.debugBtn} onPress={checkEwelinkStatus}>
                <Text style={styles.debugBtnText}>Ver estado del token</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.debugBtn} onPress={runDeviceDiagnosis}>
                <Text style={styles.debugBtnText}>Diagnosticar dispositivo</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.qrCard}>
            <View style={styles.qrHeader}>
              <View>
                <BrandMark size="md" />
                <Text style={styles.qrTitle}>QR de entrada</Text>
                <Text style={styles.qrSubtitle}>Usalo para habilitar ingreso en pruebas o para imprimir.</Text>
              </View>
              <TouchableOpacity style={styles.qrToggle} onPress={() => setShowEntryQr((current) => !current)}>
                <Ionicons name={showEntryQr ? 'chevron-down' : 'chevron-forward'} size={18} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {showEntryQr && (
              <View style={styles.qrPreview}>
                {loadingStoreCode ? (
                  <ActivityIndicator color={Colors.primary} size="small" />
                ) : (
                  <QRCode value={entryQrValue} size={176} backgroundColor="#fff" color="#111827" />
                )}
                <Text style={styles.qrCodeValue}>{entryQrValue}</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  camera: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    margin: Spacing.lg,
  },
  backText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  blockedContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  blockedIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  blockedTitle: {
    ...Typography.h3,
    fontSize: FontSizes.xl,
  },
  blockedSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.overlay,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 51, 40, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 51, 40, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textInverse,
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.lg,
  },
  scanArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  qrFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: Colors.accentLight,
    borderRadius: 3,
  },
  cTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  cTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  cBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  cBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  loadOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  successOverlay: {
    backgroundColor: `${Colors.successLight}D9`,
  },
  errorOverlay: {
    backgroundColor: `${Colors.errorLight}D9`,
  },
  scanHint: {
    color: Colors.textInverse,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
    opacity: 0.95,
  },
  bottomSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -18,
    ...Shadows.lg,
  },
  bottomContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  ctaCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.md,
  },
  ctaTitle: {
    ...Typography.h3,
    fontSize: FontSizes.lg,
  },
  ctaSubtitle: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  sessionHint: {
    color: Colors.textMuted,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
  resetLink: {
    color: Colors.primary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
  qrCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.md,
  },
  qrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  qrTitle: {
    ...Typography.h3,
    fontSize: FontSizes.lg,
  },
  qrSubtitle: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    marginTop: 4,
    maxWidth: 240,
  },
  qrToggle: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.sm,
  },
  qrCodeValue: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    textAlign: 'center',
    lineHeight: 18,
  },
  adminPanel: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  adminPanelTitle: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamilies.body,
    fontWeight: FontWeights.bold,
    color: Colors.warningDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  adminPanelHint: {
    fontSize: FontSizes.xs,
    fontFamily: FontFamilies.body,
    color: Colors.warningDark,
    lineHeight: 18,
  },
  adminPanelCode: {
    fontSize: FontSizes.xs,
    color: Colors.warningDark,
    fontWeight: FontWeights.medium,
    fontFamily: FontFamilies.mono,
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  debugBtn: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  debugBtnText: {
    fontSize: FontSizes.sm,
    fontFamily: FontFamilies.body,
    color: Colors.warningDark,
    fontWeight: FontWeights.semibold,
  },
});
