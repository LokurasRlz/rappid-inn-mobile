import React, { useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { uploadDocument } from '../../services/api';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';

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
        Toast.show({ type: 'success', text1: 'Frente capturado' });
        setShowCamera(false);
        setTimeout(() => { setStep('back'); setShowCamera(true); }, 400);
      } else {
        setBackUri(photo.uri);
        await uploadDocument('back', photo.base64 || '');
        Toast.show({ type: 'success', text1: 'Dorso capturado' });
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
            <BrandMark align="center" size="sm" />
            <Ionicons name="camera-outline" size={64} color={Colors.primary} />
            <Text style={styles.permTitle}>Camara necesaria</Text>
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
                <Ionicons name="close-circle" size={32} color={Colors.textInverse} />
              </TouchableOpacity>
            </View>
            <View style={styles.docFrame}>
              <View style={[styles.corner, styles.cTL]} />
              <View style={[styles.corner, styles.cTR]} />
              <View style={[styles.corner, styles.cBL]} />
              <View style={[styles.corner, styles.cBR]} />
            </View>
            <Text style={styles.camHint}>Encuadra el DNI dentro del marco</Text>
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
          <BrandMark align="center" size="sm" />
          <View style={styles.iconWrap}>
            <Ionicons name="card-outline" size={36} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Foto de DNI</Text>
          <Text style={styles.subtitle}>Necesitamos una foto de tu documento por ambos lados.</Text>
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
            onCapture={() => {
              if (!frontUri) {
                Toast.show({ type: 'error', text1: 'Primero captura el frente' });
                return;
              }
              setStep('back');
              setShowCamera(true);
            }}
            done={!!backUri}
            disabled={!frontUri}
          />
        </View>

        <View style={styles.footer}>
          <View style={styles.tipRow}>
            <Ionicons name="bulb-outline" size={16} color={Colors.warningDark} />
            <Text style={styles.tipText}>Asegurate de que el texto sea legible y sin reflejos.</Text>
          </View>
          <Button
            label={!frontUri ? 'Capturar frente' : !backUri ? 'Capturar dorso' : 'Continuar'}
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
        {done ? <Ionicons name="checkmark" size={16} color={Colors.textInverse} /> : <Text style={styles.stepNumText}>{number}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepLabel, done && styles.stepLabelDone]}>{label}</Text>
        <Text style={styles.stepDesc}>{description}</Text>
        {done ? <Text style={styles.stepCaptured}>Capturado</Text> : null}
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
  permTitle: { ...Typography.h3, fontSize: FontSizes.xl },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  backText: { fontSize: FontSizes.md, color: Colors.textSecondary, fontFamily: FontFamilies.body, fontWeight: FontWeights.medium },
  header: { alignItems: 'center', marginVertical: Spacing.xl, gap: Spacing.sm },
  iconWrap: { width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.primarySoftest, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  title: { ...Typography.h2 },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, fontFamily: FontFamilies.body },
  steps: { gap: 0, marginBottom: Spacing.xl },
  stepConnector: { height: 20, width: 2, backgroundColor: Colors.border, marginLeft: 21, marginVertical: -2 },
  docStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1.2,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  docStepDone: { borderColor: Colors.success, backgroundColor: Colors.successLight },
  docStepDisabled: { opacity: 0.45 },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primarySoftest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumDone: { backgroundColor: Colors.success },
  stepNumText: { fontSize: FontSizes.sm, fontWeight: FontWeights.bold, color: Colors.primary, fontFamily: FontFamilies.body },
  stepLabel: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.text, fontFamily: FontFamilies.body },
  stepLabelDone: { color: Colors.successDark },
  stepDesc: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2, fontFamily: FontFamilies.body },
  stepCaptured: { fontSize: FontSizes.xs, color: Colors.successDark, fontWeight: FontWeights.semibold, marginTop: 2, fontFamily: FontFamilies.body },
  thumb: { width: 64, height: 44, borderRadius: BorderRadius.sm },
  thumbPlaceholder: { width: 64, height: 44, borderRadius: BorderRadius.sm, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  footer: { marginTop: 'auto' as any, paddingBottom: Spacing.lg, gap: Spacing.md },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.warningLight, padding: Spacing.md, borderRadius: BorderRadius.md },
  tipText: { flex: 1, fontSize: FontSizes.sm, color: Colors.warningDark, lineHeight: 18, fontFamily: FontFamilies.body },
  cameraOverlay: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 48, backgroundColor: 'rgba(33, 51, 40, 0.4)' },
  camHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', paddingHorizontal: 24 },
  camTitle: { color: Colors.textInverse, fontSize: FontSizes.xl, fontFamily: FontFamilies.editorial },
  docFrame: { width: 280, height: 176, position: 'relative' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.accentLight },
  cTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 4 },
  cTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 4 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 4 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 4 },
  camHint: { color: Colors.textInverse, fontSize: FontSizes.md, fontFamily: FontFamilies.body, opacity: 0.85 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: Colors.textInverse, alignItems: 'center', justifyContent: 'center' },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.textInverse },
});
