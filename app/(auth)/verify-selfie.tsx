import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { uploadSelfie, autoVerify } from '../../services/api';
import { useAuthStore } from '../../services/authStore';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';

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
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      setSelfieUri(photo.uri);
      await uploadSelfie(photo.base64 || '');
      await refreshUser();
      setShowCamera(false);
    } catch {
      Alert.alert('Error', 'No se pudo capturar la selfie');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!selfieUri) {
      Alert.alert('Falta selfie', 'Primero tomá tu foto');
      return;
    }
    setLoading(true);
    try {
      await autoVerify();
      updateVerification('verified');
      await refreshUser();
      Alert.alert(
        '¡Cuenta verificada! 🎉',
        'Tu identidad fue confirmada. Ya podés usar Rapid Inn.',
        [{ text: 'Empezar', onPress: () => router.replace('/(app)/home') }],
      );
    } catch (e: any) {
      const msg = e?.response?.data?.error || 'Faltan documentos';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.center}>
            <Text style={styles.permText}>Necesitamos acceso a la cámara frontal</Text>
            <TouchableOpacity style={styles.btn} onPress={requestPermission}>
              <Text style={styles.btnText}>Permitir</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="front">
          <View style={styles.cameraOverlay}>
            <View style={styles.faceFrame} />
            <Text style={styles.cameraHint}>Mirá a la cámara y sonreí</Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takeSelfie} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <View style={styles.captureInner} />}
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCamera(false)}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </CameraView>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Selfie de verificación</Text>
          <Text style={styles.subtitle}>
            Tomá una foto de tu cara para confirmar que sos vos
          </Text>
        </View>

        {/* Selfie preview or placeholder */}
        <TouchableOpacity style={styles.selfieCard} onPress={() => setShowCamera(true)}>
          {selfieUri ? (
            <Image source={{ uri: selfieUri }} style={styles.selfieImage} />
          ) : (
            <View style={styles.selfiePlaceholder}>
              <Text style={styles.selfieIcon}>🤳</Text>
              <Text style={styles.selfieHint}>Toca para tomar selfie</Text>
            </View>
          )}
          {selfieUri && (
            <View style={styles.retakeOverlay}>
              <Text style={styles.retakeText}>Toca para repetir</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Tips */}
        <View style={styles.tips}>
          <TipRow icon="💡" text="Buena iluminación en tu cara" />
          <TipRow icon="👀" text="Mirá directamente a la cámara" />
          <TipRow icon="😐" text="Rostro descubierto, sin gafas de sol" />
        </View>

        <TouchableOpacity
          style={[styles.finishBtn, (!selfieUri || loading) && styles.finishBtnDisabled]}
          onPress={handleFinish}
          disabled={!selfieUri || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.finishBtnText}>
                {selfieUri ? 'Finalizar verificación ✓' : 'Tomá tu selfie primero'}
              </Text>
          }
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function TipRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.tipRow}>
      <Text style={styles.tipIcon}>{icon}</Text>
      <Text style={styles.tipText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  permText: { fontSize: FontSizes.md, color: Colors.text },
  btn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: 12,
  },
  btnText: { color: '#fff', fontWeight: '700' },
  back: { marginTop: Spacing.md },
  backText: { color: Colors.primary, fontSize: FontSizes.md, fontWeight: '600' },
  header: { marginTop: Spacing.lg, marginBottom: Spacing.lg },
  title: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: 4, lineHeight: 22 },
  selfieCard: {
    width: 220, height: 220, borderRadius: 110, overflow: 'hidden',
    alignSelf: 'center', borderWidth: 3, borderColor: Colors.primary,
    backgroundColor: Colors.borderLight, marginVertical: Spacing.xl,
    ...Shadows.md,
  },
  selfieImage: { width: '100%', height: '100%' },
  selfiePlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  selfieIcon: { fontSize: 56 },
  selfieHint: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: '600' },
  retakeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center', justifyContent: 'flex-end',
    paddingBottom: Spacing.md,
  },
  retakeText: { color: '#fff', fontSize: FontSizes.sm, fontWeight: '700' },
  tips: { gap: Spacing.sm, marginBottom: Spacing.xl },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tipIcon: { fontSize: 18, width: 28, textAlign: 'center' },
  tipText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  finishBtn: {
    backgroundColor: Colors.secondary, borderRadius: BorderRadius.md,
    paddingVertical: 16, alignItems: 'center', ...Shadows.md,
  },
  finishBtnDisabled: { backgroundColor: Colors.border },
  finishBtnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
  // Camera
  cameraOverlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 60, gap: Spacing.md,
  },
  faceFrame: {
    width: 200, height: 240, borderWidth: 2.5,
    borderColor: '#fff', borderRadius: 100, borderStyle: 'dashed',
  },
  cameraHint: {
    color: '#fff', fontSize: FontSizes.md, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center', marginTop: Spacing.xl,
  },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  cancelBtn: { marginTop: Spacing.md },
  cancelText: {
    color: '#fff', fontSize: FontSizes.md, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
});
