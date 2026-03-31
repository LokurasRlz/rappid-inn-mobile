import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontSizes, FontWeights, Shadows, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../services/authStore';

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
      Alert.alert('Datos incompletos', 'Completa los campos del primer paso.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Contraseñas distintas', 'La confirmación no coincide.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'Usa al menos 6 caracteres.');
      return;
    }

    setStep(2);
  };

  const handleRegister = async () => {
    if (!dni || !birthDate || !phone) {
      Alert.alert('Datos incompletos', 'Completa DNI, fecha de nacimiento y teléfono.');
      return;
    }

    if (dni.trim().length < 7 || dni.trim().length > 10) {
      Alert.alert('DNI inválido', 'El DNI debe tener entre 7 y 10 dígitos.');
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
      Alert.alert('No pudimos crear la cuenta', error?.response?.data?.error || 'Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <TouchableOpacity onPress={() => (step === 2 ? setStep(1) : router.back())}>
            <Text style={styles.backText}>{step === 2 ? 'Anterior' : 'Volver'}</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.stepText}>Paso {step} de 2</Text>
            <Text style={styles.title}>{step === 1 ? 'Crear tu cuenta' : 'Validar identidad'}</Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? 'Primero definimos tus credenciales de acceso.'
                : 'Luego te pedimos los datos base para el flujo de verificación.'}
            </Text>
          </View>

          <View style={styles.progress}>
            <View style={[styles.progressFill, { width: step === 1 ? '50%' : '100%' }]} />
          </View>

          <Card variant="elevated" style={styles.formCard}>
            {step === 1 ? (
              <>
                <Input label="Nombre completo" value={name} onChangeText={setName} placeholder="Juan Perez" />
                <Input label="Email" value={email} onChangeText={setEmail} placeholder="tu@email.com" keyboardType="email-address" />
                <Input label="Contraseña" value={password} onChangeText={setPassword} placeholder="Minimo 6 caracteres" secureTextEntry />
                <Input label="Confirmar contraseña" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repite la contraseña" secureTextEntry />
                <Button label="Continuar" onPress={handleStep1} />
              </>
            ) : (
              <>
                <Input label="DNI" value={dni} onChangeText={setDni} placeholder="12345678" keyboardType="number-pad" />
                <Input label="Fecha de nacimiento" value={birthDate} onChangeText={setBirthDate} placeholder="1990-05-20" />
                <Input label="Telefono" value={phone} onChangeText={setPhone} placeholder="+54 9 11 1234-5678" keyboardType="phone-pad" />
                <Card variant="flat" style={styles.noticeCard}>
                  <Text style={styles.noticeTitle}>Siguiente paso</Text>
                  <Text style={styles.noticeText}>
                    Después del alta continuarás con DNI frente/dorso, OTP por SMS y selfie.
                  </Text>
                </Card>
                <Button label="Crear cuenta" onPress={handleRegister} loading={loading} />
              </>
            )}
          </Card>

          <TouchableOpacity style={styles.linkButton} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.linkText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    padding: Spacing.md,
    gap: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  backText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  header: {
    gap: Spacing.sm,
  },
  stepText: {
    color: Colors.primary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  title: {
    color: Colors.text,
    fontSize: 38,
    fontWeight: FontWeights.extrabold,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    lineHeight: 24,
  },
  progress: {
    height: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  formCard: {
    gap: Spacing.md,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  noticeCard: {
    gap: 6,
  },
  noticeTitle: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
  },
  noticeText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  linkText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
