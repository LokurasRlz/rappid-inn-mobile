import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';

import { useAuthStore } from '../../services/authStore';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../constants/theme';

export default function RegisterScreen() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const { register } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dni, setDni] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');

  const handleStep1 = () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Completa todos los campos del primer paso.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setStep(2);
  };

  const handleRegister = async () => {
    if (!dni || !birthDate || !phone) {
      Alert.alert('Error', 'Completa DNI, fecha de nacimiento y teléfono.');
      return;
    }

    if (dni.trim().length < 7 || dni.trim().length > 10) {
      Alert.alert('Error', 'El DNI debe tener entre 7 y 10 dígitos.');
      return;
    }

    setLoading(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        dni: dni.trim(),
        birth_date: birthDate.trim(),
        phone: phone.trim(),
      });

      router.replace('/(auth)/verify-doc');
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || 'No se pudo crear la cuenta.');
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
        <ScrollView contentContainerStyle={styles.inner} keyboardShouldPersistTaps="handled">
          <TouchableOpacity style={styles.back} onPress={() => (step === 2 ? setStep(1) : router.back())}>
            <Text style={styles.backText}>{step === 2 ? 'Anterior' : 'Volver'}</Text>
          </TouchableOpacity>

          <View style={styles.progress}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={[styles.progressLine, step >= 2 && styles.progressLineActive]} />
            <View style={[styles.progressDot, step >= 2 && styles.progressDotActive]} />
          </View>

          <View style={styles.header}>
            <Text style={styles.stepLabel}>Paso {step} de 2</Text>
            <Text style={styles.title}>
              {step === 1 ? 'Crear cuenta' : 'Datos personales'}
            </Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Primero definimos tus credenciales.'
                : 'Luego completamos los datos para validarte.'}
            </Text>
          </View>

          {step === 1 ? (
            <View style={styles.form}>
              <Field label="Nombre completo" value={name} onChange={setName} placeholder="Juan Perez" />
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="tu@email.com"
                keyboard="email-address"
                autoCapitalize="none"
              />
              <Field label="Contraseña" value={password} onChange={setPassword} placeholder="Minimo 6 caracteres" secure />
              <Field
                label="Confirmar contraseña"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repite tu contraseña"
                secure
              />

              <TouchableOpacity style={styles.button} onPress={handleStep1}>
                <Text style={styles.buttonText}>Continuar</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <Field label="DNI" value={dni} onChange={setDni} placeholder="12345678" keyboard="number-pad" />
              <Field label="Fecha de nacimiento" value={birthDate} onChange={setBirthDate} placeholder="1990-05-20" />
              <Field label="Telefono" value={phone} onChange={setPhone} placeholder="+54 9 11 1234-5678" keyboard="phone-pad" />

              <View style={styles.notice}>
                <Text style={styles.noticeText}>
                  Después del alta vas a continuar con DNI, OTP y selfie para quedar verificado.
                </Text>
              </View>

              <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleRegister} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear cuenta</Text>}
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.loginLink} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.loginText}>
              ¿Ya tienes cuenta? <Text style={styles.loginBold}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

interface FieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboard?: any;
  autoCapitalize?: any;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  secure,
  keyboard,
  autoCapitalize,
}: FieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        secureTextEntry={secure}
        keyboardType={keyboard}
        autoCapitalize={autoCapitalize || 'words'}
        placeholderTextColor={Colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },
  back: { marginTop: Spacing.md },
  backText: { color: Colors.primary, fontSize: FontSizes.md, fontWeight: '700' },
  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.border,
  },
  progressDotActive: { backgroundColor: Colors.primary },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: Colors.border,
    marginHorizontal: 4,
  },
  progressLineActive: { backgroundColor: Colors.primary },
  header: { marginBottom: Spacing.xl },
  stepLabel: { fontSize: FontSizes.sm, color: Colors.primary, fontWeight: '700', marginBottom: 4 },
  title: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.text },
  subtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, marginTop: 4 },
  form: { gap: Spacing.md },
  field: { gap: 6 },
  label: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.text },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    fontSize: FontSizes.md,
    color: Colors.text,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
    ...Shadows.md,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '800' },
  notice: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  noticeText: { fontSize: FontSizes.sm, color: Colors.primary, lineHeight: 20 },
  loginLink: { marginTop: Spacing.xl, alignItems: 'center' },
  loginText: { fontSize: FontSizes.md, color: Colors.textSecondary },
  loginBold: { color: Colors.primary, fontWeight: '800' },
});
