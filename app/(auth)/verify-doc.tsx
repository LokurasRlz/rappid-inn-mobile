import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { uploadDocument } from '../../services/api';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';

type DocSide = 'front' | 'back';

export default function VerifyDocScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [step, setStep] = useState<DocSide>('front');
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<any>(null);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    setLoading(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.6 });
      if (step === 'front') {
        setFrontUri(photo.uri);
        await uploadDocument('front', photo.base64 || '');
        Toast.show({ type: 'success', text1: '✓ Frente capturado' });
        setShowCamera(false);
        setTimeout(() => { setStep('back'); setShowCamera(true); }, 400);
      } else {
        setBackUri(photo.uri);
        await uploadDocument('back', photo.base64 || '');
        Toast.show({ type: 'success', text1: '✓ Dorso capturado' });
        setShowCamera(false);
      }
    } catch {
      Toast.show({ type: 'error', text1: 'Error al capturar la imagen' });
    } finally {
      setLoading(false);
    }
  };

  if (showCamera) {
    if (!permission?.granted) {
      return (
        <ScreenWrapper>
          <View style={styles.permContainer}>
            <Ionicons name="camera-outline" size={64} color={Colors.primary} />
            <Text style={styles.permTitle}>Cámara necesaria</Text>
            <Button label="Permitir acceso" onPress={requestPermission} fullWidth={false} />
          </View>
        </ScreenWrapper>
      );
    }
    return (
      <View style={{ flex: 1 }}>
        <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back">
          <View style={styles.cameraOverlay}>
            <View style={styles.camHeader}>
              <Text style={styles.camTitle}>{step === 'front' ? 'Frente del DNI' : 'Dorso del DNI'}</Text>
              <TouchableOpacity onPress={() => setShowCamera(false)}>
                <Ionicons name="close-circle" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
            <View style={styles.docFrame}>
              <View style={[styles.corner, styles.cTL]} />
              <View style={[styles.corner, styles.cTR]} />
              <View style={[styles.corner, styles.cBL]} />
              <View style={[styles.corner, styles.cBR]} />
            </View>
            <Text style={styles.camHint}>Encuadrá el DNI dentro del marco</Text>
            <TouchableOpacity style={styles.captureBtn} onPress={takePicture} disabled={loading}>
              <View style={styles.captureInner} />
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

        <View style={styles.header}>
          <View style={styles.iconWrap}>
            <Ionicons name="card-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Foto de DNI</Text>
          <Text style={styles.subtitle}>Necesitamos una foto de tu documento por ambos lados</Text>
        </View>

        <View style={styles.steps}>
          <DocStep
            number={1}
            label="Frente del DNI"
            description="La cara con tu foto y nombre"
            uri={frontUri}
            onCapture={() => { setStep('front'); setShowCamera(true); }}
            done={!!frontUri}
          />
          <View style={styles.stepConnector} />
          <DocStep
            number={2}
            label="Dorso del DNI"
            description="La parte trasera del documento"
            uri={backUri}
            onCapture={() => { if (!frontUri) { Toast.show({ type: 'error', text1: 'Primero capturá el frente' }); return; } setStep('back'); setShowCamera(true); }}
            done={!!backUri}
            disabled={!frontUri}
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.tipRow}>
            <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
            <Text style={styles.tipText}>Asegurate de que el texto sea legible y sin reflejos</Text>
          </View>
          <Button
            label={!frontUri ? 'Capturar frente →' : !backUri ? 'Capturar dorso →' : 'Continuar →'}
            onPress={() => {
              if (!frontUri) { setStep('front'); setShowCamera(true); }
              else if (!backUri) { setStep('back'); setShowCamera(true); }
              else router.push('/(auth)/verify-otp');
            }}
            size="lg"
            variant={frontUri && backUri ? 'success' : 'primary'}
          />
        </View>
      </View>
    </ScreenWrapper>
  );
}

function DocStep({ number, label, description, uri, onCapture, done, disabled }: any) {
  return (
    <TouchableOpacity style={[styles.docStep, done && styles.docStepDone, disabled && styles.docStepDisabled]} onPress={onCapture} disabled={disabled}>
      <View style={[styles.stepNum, done && styles.stepNumDone]}>
        {done ? <Ionicons name="checkmark" size={16} color="#fff" /> : <Text style={[styles.stepNumText, done && { color: '#fff' }]}>{number}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{label}</Text>
        <Text style={styles.stepDesc}>{description}</Text>
        {done && <Text style={styles.stepCaptured}>Capturado ✓</Text>}
      </View>
      {uri ? (
        <Image source={{ uri }} style={styles.thumb} />
      ) : (
        <View style={styles.thumbPlaceholder}>
          <Ionicons name="camera" size={22} color={disabled ? Colors.textMuted : Colors.primary} />
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, paddingHorizontal: Spacing.lg },
  permContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  permTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.text },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  backText: { fontSize: FontSizes.md, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  header: { alignItems: 'center', marginVertical: Spacing.xl, gap: Spacing.sm },
  iconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  title: { fontSize: FontSizes.xxl, fontWeight: FontWeights.extrabold, color: Colors.text },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  steps: { gap: 0, marginBottom: Spacing.xl },
  stepConnector: { height: 20, width: 2, backgroundColor: Colors.border, marginLeft: 21, marginVertical: -2 },
  docStep: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, borderWidth: 1.5, borderColor: Colors.border,
    ...Shadows.sm,
  },
  docStepDone: { borderColor: Colors.success, backgroundColor: Colors.successLight + '30' },
  docStepDisabled: { opacity: 0.45 },
  stepNum: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  stepNumDone: { backgroundColor: Colors.success },
  stepNumText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.primary },
  stepLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.text },
  stepLabelDone: { color: Colors.successDark },
  stepDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  stepCaptured: { fontSize: FontSizes.xs, color: Colors.success, fontWeight: FontWeights.semibold, marginTop: 2 },
  thumb: { width: 64, height: 44, borderRadius: BorderRadius.sm },
  thumbPlaceholder: { width: 64, height: 44, borderRadius: BorderRadius.sm, backgroundColor: Colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: 'auto' as any, paddingBottom: Spacing.lg, gap: Spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.warningLight, padding: Spacing.md, borderRadius: BorderRadius.md },
  tipText: { flex: 1, fontSize: FontSizes.sm, color: Colors.warningDark, lineHeight: 18 },
  // Camera
  cameraOverlay: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 48, backgroundColor: 'rgba(0,0,0,0.4)' },
  camHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 24 },
  camTitle: { color: '#fff', fontSize: FontSizes.xl, fontWeight: FontWeights.bold },
  docFrame: { width: 280, height: 176, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#fff' },
  cTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  camHint: { color: '#fff', fontSize: FontSizes.md, fontWeight: FontWeights.medium, opacity: 0.85 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
});
