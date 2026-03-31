import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import ScreenWrapper from '../components/ui/ScreenWrapper';
import { Colors, FontSizes, FontWeights, Spacing } from '../constants/theme';
import { useAuthStore } from '../services/authStore';
import { getVerificationRoute } from '../services/verificationFlow';

export default function Index() {
  const { isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingTitle}>Cargando Rapid Inn</Text>
          <Text style={styles.loadingText}>Estamos preparando tu acceso.</Text>
        </View>
      </ScreenWrapper>
    );
  }

  return <Redirect href={getVerificationRoute(user) as any} />;
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
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
});
