import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, FlatList, Image,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '../../services/authStore';
import { useCartStore } from '../../services/cartStore';
import { getProducts } from '../../services/api';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
  image_url?: string;
  barcode?: string;
}

const CATEGORIES = ['Todos', 'Bebidas', 'Snacks', 'Lácteos', 'Carnes', 'Frutas'];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { fetchSummary, addItem } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProducts();
    fetchSummary();
  }, []);

  const loadProducts = async (category?: string) => {
    try {
      const cat = category && category !== 'Todos' ? category.toLowerCase() : undefined;
      const res = await getProducts(1, cat);
      setProducts(res.data.data || []);
    } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts(selectedCategory);
    await fetchSummary();
    setRefreshing(false);
  };

  const handleCategory = (cat: string) => {
    setSelectedCategory(cat);
    loadProducts(cat);
  };

  const isVerified = user?.verification_status === 'verified';
  const isPending = user?.verification_status === 'pending';
  const isUnverified = user?.verification_status === 'unverified';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.subGreeting}>¿Qué vas a llevar hoy?</Text>
          </View>
          <TouchableOpacity
            style={styles.qrButton}
            onPress={() => router.push('/(app)/qr-access')}
          >
            <Text style={styles.qrButtonIcon}>📲</Text>
            <Text style={styles.qrButtonText}>Entrar</Text>
          </TouchableOpacity>
        </View>

        {/* Verification banner */}
        {isUnverified && (
          <TouchableOpacity
            style={styles.verifyBanner}
            onPress={() => router.push('/(auth)/verify-doc')}
          >
            <Text style={styles.verifyBannerIcon}>🔐</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.verifyBannerTitle}>Verificá tu identidad</Text>
              <Text style={styles.verifyBannerSubtitle}>
                Completá la verificación para acceder a la tienda
              </Text>
            </View>
            <Text style={styles.verifyBannerArrow}>→</Text>
          </TouchableOpacity>
        )}

        {isPending && (
          <View style={[styles.verifyBanner, styles.pendingBanner]}>
            <Text style={styles.verifyBannerIcon}>⏳</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.verifyBannerTitle}>Verificación en proceso</Text>
              <Text style={styles.verifyBannerSubtitle}>Revisaremos tus documentos en 24-48hs</Text>
            </View>
          </View>
        )}

        {/* Quick actions */}
        <View style={styles.quickActions}>
          <QuickAction
            icon="📷"
            label="Escanear"
            color={Colors.primary}
            onPress={() => router.push('/(app)/scanner')}
          />
          <QuickAction
            icon="📲"
            label="QR Acceso"
            color={Colors.secondary}
            onPress={() => router.push('/(app)/qr-access')}
          />
          <QuickAction
            icon="🛒"
            label="Mi carrito"
            color={Colors.accent}
            onPress={() => router.push('/(app)/cart')}
          />
          <QuickAction
            icon="📦"
            label="Perfil"
            color="#8B5CF6"
            onPress={() => router.push('/(app)/profile')}
          />
        </View>

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Categorías</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categories}>
            {CATEGORIES.map(cat => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
                onPress={() => handleCategory(cat)}
              >
                <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productos</Text>
          {products.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📦</Text>
              <Text style={styles.emptyText}>No hay productos disponibles</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={() => addItem(product.id)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickAction({
  icon, label, color, onPress,
}: { icon: string; label: string; color: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Text style={{ fontSize: 24 }}>{icon}</Text>
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ProductCard({
  product, onAddToCart,
}: { product: Product; onAddToCart: () => void }) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productImage}>
        {product.image_url
          ? <Image source={{ uri: product.image_url }} style={{ width: '100%', height: '100%' }} />
          : <Text style={{ fontSize: 32 }}>🛍️</Text>
        }
      </View>
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productPrice}>${Number(product.price).toFixed(2)}</Text>
      <TouchableOpacity style={styles.addBtn} onPress={onAddToCart}>
        <Text style={styles.addBtnText}>+ Agregar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md,
  },
  greeting: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.text },
  subGreeting: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  qrButton: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    alignItems: 'center', ...Shadows.md,
  },
  qrButtonIcon: { fontSize: 20 },
  qrButtonText: { color: '#fff', fontSize: FontSizes.xs, fontWeight: '700', marginTop: 2 },
  verifyBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.primaryLight, margin: Spacing.lg,
    borderRadius: BorderRadius.lg, padding: Spacing.md, gap: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary + '40',
  },
  pendingBanner: { backgroundColor: Colors.warningLight, borderColor: Colors.warning + '40' },
  verifyBannerIcon: { fontSize: 22 },
  verifyBannerTitle: { fontSize: FontSizes.sm, fontWeight: '700', color: Colors.text },
  verifyBannerSubtitle: { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 1 },
  verifyBannerArrow: { color: Colors.primary, fontSize: FontSizes.lg, fontWeight: '700' },
  quickActions: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.md,
  },
  quickAction: { alignItems: 'center', gap: 6 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: BorderRadius.lg,
    alignItems: 'center', justifyContent: 'center',
  },
  quickActionLabel: { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: '600' },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.text, marginBottom: Spacing.md },
  categories: { flexDirection: 'row' },
  categoryChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderRadius: BorderRadius.full, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border, marginRight: Spacing.sm,
  },
  categoryChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryText: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.textSecondary },
  categoryTextActive: { color: '#fff' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  productCard: {
    width: '47%', backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    ...Shadows.sm, borderWidth: 1, borderColor: Colors.borderLight,
  },
  productImage: {
    width: '100%', height: 90, borderRadius: BorderRadius.md,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.sm, overflow: 'hidden',
  },
  productName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text, minHeight: 36 },
  productPrice: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.primary, marginVertical: 4 },
  addBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.sm,
    paddingVertical: 8, alignItems: 'center', marginTop: 4,
  },
  addBtnText: { color: '#fff', fontSize: FontSizes.xs, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: FontSizes.md, color: Colors.textSecondary },
});
