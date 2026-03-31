import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator, Image,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { uploadDocument } from '../../services/api';
import { useAuthStore } from '../../services/authStore';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';

type DocSide = 'front' | 'back';

export default function VerifyDocScreen() {
  const { refreshUser } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<DocSide>('front');
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const cameraRef = useRef<any>(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      if (step === 'front') {
        setFrontUri(photo.uri);
        await uploadDocument('front', photo.base64 || '');
      } else {
        setBackUri(photo.uri);
        await uploadDocument('back', photo.base64 || '');
      }
      await refreshUser();
      setShowCamera(false);
    } catch (e) {
      Alert.alert('Error', 'No se pudo capturar la imagen');
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (!frontUri) {
      Alert.alert('Falta foto', 'Capturá el frente del DNI');
      return;
    }
    if (!backUri) {
      setStep('back');
      setShowCamera(true);
      return;
    }
    router.push('/(auth)/verify-otp');
  };

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <SafeAreaView style={styles.container}>
          <View style={styles.center}>
            <Text style={styles.permText}>Se necesita acceso a la cámara</Text>
            <TouchableOpacity style={styles.btn} onPress={requestPermission}>
              <Text style={styles.btnText}>Permitir cámara</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.docFrame} />
            <Text style={styles.cameraHint}>
              {step === 'front' ? 'Encuadrá el frente de tu DNI' : 'Encuadrá el dorso de tu DNI'}
            </Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture} disabled={loading}>
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
          <Text style={styles.title}>Verificación de identidad</Text>
          <Text style={styles.subtitle}>Necesitamos una foto de tu DNI por ambos lados</Text>
        </View>

        {/* Front */}
        <DocCard
          label="Frente del DNI"
          uri={frontUri}
          done={!!frontUri}
          onCapture={() => {
            setStep('front');
            setShowCamera(true);
          }}
        />

        {/* Back */}
        <DocCard
          label="Dorso del DNI"
          uri={backUri}
          done={!!backUri}
          onCapture={() => {
            if (!frontUri) {
              Alert.alert('Primero capturá el frente');
              return;
            }
            setStep('back');
            setShowCamera(true);
          }}
          disabled={!frontUri}
        />

        <TouchableOpacity
          style={[styles.nextBtn, (!frontUri || !backUri) && styles.nextBtnDisabled]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {!frontUri ? 'Capturar frente →'
              : !backUri ? 'Capturar dorso →'
              : 'Continuar →'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.tip}>
          💡 Asegurate de que el texto sea legible y no haya reflejos
        </Text>
      </View>
    </SafeAreaView>
  );
}

function DocCard({
  label, uri, done, onCapture, disabled,
}: {
  label: string; uri: string | null; done: boolean;
  onCapture: () => void; disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.card, done && styles.cardDone, disabled && styles.cardDisabled]}
      onPress={onCapture}
      disabled={disabled}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={styles.cardPlaceholder}>
          <Text style={styles.cardIcon}>{done ? '✅' : '📷'}</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={[styles.cardStatus, done && styles.cardStatusDone]}>
          {done ? 'Capturado ✓' : disabled ? 'Primero el frente' : 'Toca para capturar'}
        </Text>
      </View>
    </TouchableOpacity>
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
  header: { marginTop: Spacing.lg, marginBottom: Spacing.xl },
  title: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: 4 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  cardDone: { borderColor: Colors.success },
  cardDisabled: { opacity: 0.4 },
  cardImage: { width: 80, height: 56, borderRadius: BorderRadius.sm },
  cardPlaceholder: {
    width: 80, height: 56, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  cardIcon: { fontSize: 28 },
  cardInfo: { flex: 1, marginLeft: Spacing.md },
  cardLabel: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text },
  cardStatus: { fontSize: FontSizes.sm, color: Colors.textMuted, marginTop: 2 },
  cardStatusDone: { color: Colors.success },
  nextBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 16, alignItems: 'center', marginTop: Spacing.sm, ...Shadows.md,
  },
  nextBtnDisabled: { opacity: 0.5 },
  nextBtnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
  tip: { fontSize: FontSizes.sm, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.md },
  // Camera
  cameraOverlay: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingBottom: 80, gap: Spacing.md,
  },
  docFrame: {
    width: 280, height: 180, borderWidth: 2.5,
    borderColor: '#fff', borderRadius: 12,
    borderStyle: 'dashed',
  },
  cameraHint: {
    color: '#fff', fontSize: FontSizes.md, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    borderWidth: 4, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  captureInner: {
    width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff',
  },
  cancelBtn: { marginTop: Spacing.md },
  cancelText: {
    color: '#fff', fontSize: FontSizes.md, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
});
