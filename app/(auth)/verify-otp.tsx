import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { sendOtp, verifyOtp } from '../../services/api';
import { useAuthStore } from '../../services/authStore';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';

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
      const t = setTimeout(() => setTimer(v => v - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [timer]);

  const handleSend = async () => {
    if (!phone) { Toast.show({ type: 'error', text1: 'Ingresá tu teléfono' }); return; }
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      setSent(true);
      setTimer(60);
      if (res.data.debug_otp) {
        setDebugOtp(res.data.debug_otp);
        Toast.show({ type: 'info', text1: '🔧 Debug OTP', text2: `Código: ${res.data.debug_otp}`, visibilityTime: 8000 });
      }
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Error', text2: e?.response?.data?.error || 'No se pudo enviar' });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { Toast.show({ type: 'error', text1: 'El código tiene 6 dígitos' }); return; }
    setLoading(true);
    try {
      await verifyOtp(otp);
      updateVerification('pending');
      Toast.show({ type: 'success', text1: 'Teléfono verificado ✓' });
      router.push('/(auth)/verify-selfie');
    } catch (e: any) {
      Toast.show({ type: 'error', text1: 'Código incorrecto', text2: e?.response?.data?.error || 'Intentá de nuevo' });
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

          <View style={styles.hero}>
            <View style={styles.iconWrap}>
              <Text style={{ fontSize: 40 }}>📱</Text>
            </View>
            <Text style={styles.title}>Verificar teléfono</Text>
            <Text style={styles.subtitle}>
              {sent ? `Enviamos un código SMS a ${phone}` : 'Ingresá tu número para recibir el código'}
            </Text>
          </View>

          {debugOtp && (
            <Card style={styles.debugCard} variant="outlined">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="construct-outline" size={18} color={Colors.warning} />
                <Text style={styles.debugText}>Debug: código {debugOtp}</Text>
              </View>
            </Card>
          )}

          <Card style={styles.formCard}>
            {!sent ? (
              <>
                <Text style={styles.inputLabel}>Teléfono</Text>
                <TextInput
                  style={styles.phoneInput}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+54 9 11 1234-5678"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.textMuted}
                />
                <Button label="Enviar código" onPress={handleSend} loading={loading} size="lg" />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Código de verificación</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.otpInput}
                  value={otp}
                  onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor={Colors.textMuted}
                />
                <Button label="Verificar código" onPress={handleVerify} loading={loading} disabled={otp.length !== 6} size="lg" />
                <TouchableOpacity
                  onPress={timer === 0 ? handleSend : undefined}
                  disabled={timer > 0}
                  style={styles.resendBtn}
                >
                  <Text style={[styles.resendText, timer > 0 && { color: Colors.textMuted }]}>
                    {timer > 0 ? `Reenviar en ${timer}s` : 'Reenviar código'}
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
  inner: { flex: 1, paddingHorizontal: Spacing.lg },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.md },
  backText: { fontSize: FontSizes.md, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  hero: { alignItems: 'center', marginVertical: Spacing.xl, gap: Spacing.sm },
  iconWrap: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  title: { fontSize: FontSizes.xxl, fontWeight: FontWeights.extrabold, color: Colors.text },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  debugCard: { marginBottom: Spacing.md, borderColor: Colors.warning, padding: Spacing.md },
  debugText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.warning },
  formCard: { gap: Spacing.md, padding: Spacing.lg },
  inputLabel: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.text },
  phoneInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: 14, height: 52, fontSize: FontSizes.md, color: Colors.text,
    backgroundColor: Colors.surface,
  },
  otpInput: {
    borderWidth: 2, borderColor: Colors.primary, borderRadius: BorderRadius.md,
    height: 64, fontSize: FontSizes.xxxl, fontWeight: FontWeights.extrabold,
    letterSpacing: 16, textAlign: 'center', color: Colors.text,
    backgroundColor: Colors.primaryLight,
  },
  resendBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  resendText: { fontSize: FontSizes.md, color: Colors.primary, fontWeight: FontWeights.semibold },
});
