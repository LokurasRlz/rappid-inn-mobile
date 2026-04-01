import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import BrandMark from '../components/ui/BrandMark';
import ScreenWrapper from '../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontFamilies, FontSizes, Shadows, Spacing, Typography } from '../constants/theme';
import { useAuthStore } from '../services/authStore';
import { getVerificationRoute } from '../services/verificationFlow';

export default function Index() {
  const { isLoading, user } = useAuthStore();

  if (isLoading) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <BrandMark align="center" size="md" subtitle="Estamos preparando tu acceso al barrio y tu experiencia de compra." />
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingTitle}>Cargando Market House</Text>
          <Text style={styles.loadingText}>Un momento, ya dejamos tu acceso listo.</Text>
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
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.lg,
  },
  loadingTitle: {
    ...Typography.h3,
    fontSize: FontSizes.xl,
    textAlign: 'center',
  },
  loadingText: {
    fontFamily: FontFamilies.body,
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    textAlign: 'center',
  },
});
