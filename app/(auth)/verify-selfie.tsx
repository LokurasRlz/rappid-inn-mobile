import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { uploadSelfie, autoVerify } from '../../services/api';
import { useAuthStore } from '../../services/authStore';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';

export default function VerifySelfieScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [selfieUri, setSelfieUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateVerification, refreshUser } = useAuthStore();
  const cameraRef = useRef<any>(null);

  const takeSelfie = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.65 });
      setSelfieUri(photo.uri);
      await uploadSelfie(photo.base64 || '');
      Toast.show({ type: 'success', text1: 'Selfie capturada' });
      setShowCamera(false);
    } catch {
      Toast.show({ type: 'error', text1: 'Error al capturar la selfie' });
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!selfieUri) {
      Toast.show({ type: 'error', text1: 'Primero toma tu selfie' });
      return;
    }
    setLoading(true);
    try {
      await autoVerify();
      updateVerification('verified');
      await refreshUser();
      Toast.show({ type: 'success', text1: 'Cuenta verificada', text2: 'Ya puedes acceder a Market House', visibilityTime: 3000 });
      setTimeout(() => router.replace('/(app)/home'), 2000);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.error || 'Faltan documentos' });
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <ScreenWrapper>
          <View style={styles.permContainer}>
            <BrandMark align="center" size="sm" />
            <Ionicons name="camera-reverse-outline" size={64} color={Colors.primary} />
            <Text style={styles.permTitle}>Camara frontal</Text>
            <Button label="Permitir" onPress={requestPermission} fullWidth={false} />
          </View>
        </ScreenWrapper>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
          <View style={styles.cameraOverlay}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => setShowCamera(false)}>
              <Ionicons name="close-circle" size={32} color={Colors.textInverse} />
            </TouchableOpacity>
            <View style={styles.faceGuide} />
            <Text style={styles.camHint}>Mira a la camara con buena luz</Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takeSelfie} disabled={loading}>
              {loading ? <ActivityIndicator color={Colors.textInverse} /> : <View style={styles.captureInner} />}
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>

        <Card variant="elevated" style={styles.heroCard}>
          <BrandMark size="md" subtitle="Una selfie clara termina la validacion para que puedas usar acceso y compra sin friccion." />
        </Card>

        <TouchableOpacity style={styles.selfieContainer} onPress={() => setShowCamera(true)}>
          {selfieUri ? (
            <>
              <Image source={{ uri: selfieUri }} style={styles.selfieImage} />
              <View style={styles.retakeOverlay}>
                <Ionicons name="camera-reverse-outline" size={24} color={Colors.textInverse} />
                <Text style={styles.retakeText}>Repetir</Text>
              </View>
            </>
          ) : (
            <View style={styles.selfiePlaceholder}>
              <Ionicons name="person-circle-outline" size={72} color={Colors.textMuted} />
              <Text style={styles.selfieHint}>Toca para tomar selfie</Text>
            </View>
          )}
        </TouchableOpacity>

        <Card style={styles.tipsCard} variant="flat">
          {[
            { icon: 'sunny-outline', text: 'Buena iluminacion en tu cara' },
            { icon: 'eye-outline', text: 'Mira directamente a la camara' },
            { icon: 'happy-outline', text: 'Rostro descubierto y natural' },
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <Ionicons name={tip.icon as any} size={18} color={Colors.primary} />
              <Text style={styles.tipText}>{tip.text}</Text>
            </View>
          ))}
        </Card>

        <Button
          label={selfieUri ? 'Finalizar verificacion' : 'Tomar selfie primero'}
          onPress={selfieUri ? handleFinish : () => setShowCamera(true)}
          loading={loading}
          variant={selfieUri ? 'success' : 'primary'}
          size="lg"
          style={{ marginTop: 'auto' as any, marginBottom: Spacing.lg }}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  permTitle: { ...Typography.h3, fontSize: FontSizes.xl },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: FontSizes.md, color: Colors.textSecondary, fontFamily: FontFamilies.body, fontWeight: FontWeights.medium },
  heroCard: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.borderLight, ...Shadows.lg },
  selfieContainer: {
    width: 220,
    height: 220,
    borderRadius: 110,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 3,
    borderColor: Colors.primarySoft,
    backgroundColor: Colors.surfaceMuted,
    marginVertical: Spacing.lg,
    ...Shadows.md,
  },
  selfieImage: { width: '100%', height: '100%' },
  selfiePlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  selfieHint: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: FontFamilies.body },
  retakeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(33, 51, 40, 0.45)',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 16,
    gap: 4,
  },
  retakeText: { color: Colors.textInverse, fontSize: FontSizes.sm, fontFamily: FontFamilies.body, fontWeight: FontWeights.semibold },
  tipsCard: { padding: Spacing.md, gap: Spacing.sm, marginBottom: Spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tipText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontFamily: FontFamilies.body },
  cameraOverlay: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 48, backgroundColor: 'rgba(33, 51, 40, 0.3)' },
  closeBtn: { alignSelf: 'flex-end', paddingRight: 24 },
  faceGuide: { width: 220, height: 264, borderRadius: 110, borderWidth: 2.5, borderColor: Colors.accentLight, borderStyle: 'dashed' },
  camHint: { color: Colors.textInverse, fontSize: FontSizes.md, fontFamily: FontFamilies.body, opacity: 0.9 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: Colors.textInverse, alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.textInverse },
});
