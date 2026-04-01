import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect, Stack } from 'expo-router';

import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { Colors, FontSizes, FontWeights, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../services/authStore';
import { getVerificationRoute } from '../../services/verificationFlow';

export default function AuthLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingTitle}>Validando sesion</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (isAuthenticated) {
    return <Redirect href={getVerificationRoute(user) as any} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="pending-access" />
      <Stack.Screen name="verify-doc" />
      <Stack.Screen name="verify-otp" />
      <Stack.Screen name="verify-selfie" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 24,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingTitle: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
  },
});
