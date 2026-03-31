import { useEffect } from 'react';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontSizes, Shadows, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../services/authStore';
import { useCartStore } from '../../services/cartStore';
import { getVerificationRoute, requiresIdentityVerification } from '../../services/verificationFlow';

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { count, fetchCart } = useCartStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [fetchCart, isAuthenticated]);

  if (isLoading) {
    return (
      <ScreenWrapper style={styles.loadingContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingTitle}>Preparando tu cuenta</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/welcome" />;
  }

  if (requiresIdentityVerification(user) && user?.verification_status !== 'verified') {
    return <Redirect href={getVerificationRoute(user) as any} />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="home-outline" activeIcon="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Escanear',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="scan-outline" activeIcon="scan" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrito',
          tabBarIcon: ({ color, focused }) => (
            <View>
              <TabIcon icon="bag-handle-outline" activeIcon="bag-handle" color={color} focused={focused} />
              {count > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon icon="person-outline" activeIcon="person" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="qr-access" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({
  icon,
  activeIcon,
  color,
  focused,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapFocused]}>
      <Ionicons name={focused ? activeIcon : icon} size={20} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    bottom: Spacing.md,
    height: 72,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderTopWidth: 0,
    borderRadius: BorderRadius.xxl,
    ...Shadows.lg,
  },
  tabItem: {
    borderRadius: BorderRadius.lg,
  },
  tabLabel: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    marginBottom: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapFocused: {
    backgroundColor: Colors.primaryLight,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  loadingContainer: {
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  loadingCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.md,
  },
  loadingTitle: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    textAlign: 'center',
  },
});
