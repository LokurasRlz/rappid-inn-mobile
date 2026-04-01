import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { sendOtp, verifyOtp } from '../../services/api';
import { useAuthStore } from '../../services/authStore';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';

export default function VerifyOtpScreen() {
  const { user, updateVerification } = useAuthStore();
  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (timer > 0) {
      const t = setTimeout(() => setTimer((v) => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleSend = async () => {
    if (!phone) {
      Toast.show({ type: 'error', text1: 'Ingresa tu telefono' });
      return;
    }
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      setSent(true);
      setTimer(60);
      if (res.data.debug_otp) {
        setDebugOtp(res.data.debug_otp);
        Toast.show({ type: 'info', text1: 'Debug OTP', text2: `Codigo: ${res.data.debug_otp}`, visibilityTime: 8000 });
      }
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.error || 'No se pudo enviar' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      Toast.show({ type: 'error', text1: 'El codigo tiene 6 digitos' });
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(otp);
      updateVerification('pending');
      Toast.show({ type: 'success', text1: 'Telefono verificado' });
      router.push('/(auth)/verify-selfie');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Codigo incorrecto', text2: e?.response?.data?.error || 'Intenta de nuevo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inner}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color={Colors.textSecondary} />
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>

          <Card variant="elevated" style={styles.heroCard}>
            <BrandMark
              size="md"
              subtitle={sent ? `Enviamos un codigo a ${phone}.` : 'Confirma tu telefono para seguir con la verificacion.'}
            />
          </Card>

          {debugOtp ? (
            <Card style={styles.debugCard} variant="outlined">
              <View style={styles.debugRow}>
                <Ionicons name="construct-outline" size={18} color={Colors.warningDark} />
                <Text style={styles.debugText}>Debug: codigo {debugOtp}</Text>
              </View>
            </Card>
          ) : null}

          <Card style={styles.formCard}>
            {!sent ? (
              <>
                <Text style={styles.inputLabel}>Telefono</Text>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+54 9 11 1234-5678"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.textMuted}
                />
                <Button label="Enviar codigo" onPress={handleSend} loading={loading} size="lg" />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Codigo de verificacion</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={(t) => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor={Colors.textMuted}
                />
                <Button label="Verificar codigo" onPress={handleVerify} loading={loading} disabled={otp.length !== 6} size="lg" />
                <TouchableOpacity onPress={timer === 0 ? handleSend : undefined} disabled={timer > 0} style={styles.resendBtn}>
                  <Text style={[styles.resendText, timer > 0 && { color: Colors.textMuted }]}>
                    {timer > 0 ? `Reenviar en ${timer}s` : 'Reenviar codigo'}
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </Card>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  inner: { flex: 1, padding: Spacing.lg, gap: Spacing.md },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: FontSizes.md, color: Colors.textSecondary, fontFamily: FontFamilies.body, fontWeight: FontWeights.medium },
  heroCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
  },
  debugCard: { borderColor: Colors.warningDark, padding: Spacing.md },
  debugRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  debugText: { fontSize: FontSizes.md, fontFamily: FontFamilies.body, color: Colors.warningDark, fontWeight: FontWeights.semibold },
  formCard: { gap: Spacing.md, padding: Spacing.lg },
  inputLabel: { fontSize: FontSizes.sm, fontFamily: FontFamilies.body, fontWeight: FontWeights.semibold, color: Colors.textSecondary },
  phoneInput: {
    borderWidth: 1.2,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 14,
    height: 56,
    fontSize: FontSizes.md,
    color: Colors.text,
    backgroundColor: Colors.surface,
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: Colors.primarySoft,
    borderRadius: BorderRadius.lg,
    height: 68,
    fontSize: FontSizes.xxxl,
    fontFamily: FontFamilies.editorial,
    letterSpacing: 14,
    textAlign: 'center',
    color: Colors.text,
    backgroundColor: Colors.primarySoftest,
  },
  resendBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  resendText: { fontSize: FontSizes.md, color: Colors.primary, fontFamily: FontFamilies.body, fontWeight: FontWeights.semibold },
});
