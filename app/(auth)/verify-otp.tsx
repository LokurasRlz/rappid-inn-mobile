import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { router } from 'expo-router';
import { sendOtp, verifyOtp } from '../../services/api';
import { useAuthStore } from '../../services/authStore';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';

export default function VerifyOtpScreen() {
  const { user, updateVerification, refreshUser } = useAuthStore();
  const [phone, setPhone] = useState(user?.phone || '');
  const [otp, setOtp] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [debugOtp, setDebugOtp] = useState<string | null>(null);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (user?.phone) {
      setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleSendOtp = async () => {
    if (!phone) { Alert.alert('Error', 'Ingresá tu número de teléfono'); return; }
    setLoading(true);
    try {
      const res = await sendOtp(phone);
      await refreshUser();
      setSent(true);
      setResendTimer(60);
      if (res.data.debug_otp) {
        setDebugOtp(res.data.debug_otp);
        Alert.alert('🔧 Modo debug', `Código OTP: ${res.data.debug_otp}`, [{ text: 'OK' }]);
      }
      setTimeout(() => inputRef.current?.focus(), 300);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'No se pudo enviar el código');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) { Alert.alert('Error', 'El código tiene 6 dígitos'); return; }
    setLoading(true);
    try {
      await verifyOtp(otp);
      updateVerification('pending');
      await refreshUser();
      router.push('/(auth)/verify-selfie');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.error || 'Código incorrecto o expirado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.inner}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.emoji}>📱</Text>
            <Text style={styles.title}>Verificar teléfono</Text>
            <Text style={styles.subtitle}>
              {sent
                ? `Enviamos un código a ${phone}`
                : 'Ingresá tu número para recibir un código'}
            </Text>
          </View>

          {!sent ? (
            <View style={styles.form}>
              <View style={styles.field}>
                <Text style={styles.label}>Número de teléfono</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+54 9 11 1234-5678"
                  keyboardType="phone-pad"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <TouchableOpacity
                style={[styles.btn, loading && styles.btnDisabled]}
                onPress={handleSendOtp}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Enviar código</Text>
                }
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              {debugOtp && (
                <View style={styles.debugBadge}>
                  <Text style={styles.debugText}>🔧 Debug: {debugOtp}</Text>
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.label}>Código de 6 dígitos</Text>
                <TextInput
                  ref={inputRef}
                  style={[styles.input, styles.otpInput]}
                  value={otp}
                  onChangeText={t => setOtp(t.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  keyboardType="number-pad"
                  maxLength={6}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <TouchableOpacity
                style={[styles.btn, (loading || otp.length !== 6) && styles.btnDisabled]}
                onPress={handleVerify}
                disabled={loading || otp.length !== 6}
              >
                {loading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.btnText}>Verificar</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.resendBtn, resendTimer > 0 && styles.resendDisabled]}
                onPress={resendTimer === 0 ? handleSendOtp : undefined}
                disabled={resendTimer > 0}
              >
                <Text style={[styles.resendText, resendTimer > 0 && styles.resendTextDisabled]}>
                  {resendTimer > 0
                    ? `Reenviar en ${resendTimer}s`
                    : 'Reenviar código'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.lg },
  back: { marginTop: Spacing.md },
  backText: { color: Colors.primary, fontSize: FontSizes.md, fontWeight: '600' },
  header: { marginTop: Spacing.xl, marginBottom: Spacing.xl, alignItems: 'center' },
  emoji: { fontSize: 56, marginBottom: Spacing.md },
  title: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', marginTop: 4, lineHeight: 22 },
  form: { gap: Spacing.md },
  field: { gap: 6 },
  label: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    fontSize: FontSizes.md, color: Colors.text,
    borderWidth: 1.5, borderColor: Colors.border, ...Shadows.sm,
  },
  otpInput: {
    textAlign: 'center', fontSize: FontSizes.xxxl,
    fontWeight: '800', letterSpacing: 12,
  },
  btn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 16, alignItems: 'center', ...Shadows.md,
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
  resendBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  resendDisabled: {},
  resendText: { color: Colors.primary, fontSize: FontSizes.md, fontWeight: '600' },
  resendTextDisabled: { color: Colors.textMuted },
  debugBadge: {
    backgroundColor: '#FFF3CD', borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: '#F59E0B',
  },
  debugText: { color: '#92400E', fontSize: FontSizes.md, fontWeight: '700', textAlign: 'center' },
});
