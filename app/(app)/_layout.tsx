import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';

import { Colors, FontSizes } from '../../constants/theme';
import { useAuthStore } from '../../services/authStore';
import { useCartStore } from '../../services/cartStore';
import { getVerificationRoute, requiresIdentityVerification } from '../../services/verificationFlow';

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const { count, fetchCart } = useCartStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/welcome');
      return;
    }

    if (
      !isLoading &&
      isAuthenticated &&
      requiresIdentityVerification(user) &&
      user?.verification_status !== 'verified'
    ) {
      router.replace(getVerificationRoute(user) as any);
    }
  }, [isAuthenticated, isLoading, user]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchCart();
    }
  }, [fetchCart, isAuthenticated]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: FontSizes.xs, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <TabIcon icon="H" color={color} />,
        }}
      />
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Escanear',
          tabBarIcon: ({ color }) => <TabIcon icon="S" color={color} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Carrito',
          tabBarIcon: ({ color }) => (
            <View>
              <TabIcon icon="C" color={color} />
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
          tabBarIcon: ({ color }) => <TabIcon icon="P" color={color} />,
        }}
      />
      <Tabs.Screen name="checkout" options={{ href: null }} />
      <Tabs.Screen name="qr-access" options={{ href: null }} />
    </Tabs>
  );
}

function TabIcon({ icon, color }: { icon: string; color: string }) {
  return <Text style={{ fontSize: 18, fontWeight: '800', color }}>{icon}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
