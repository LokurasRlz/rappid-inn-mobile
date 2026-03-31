import { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { SkeletonProductCard } from '../../components/ui/Skeleton';
import { BorderRadius, Colors, FontSizes, FontWeights, Shadows, Spacing } from '../../constants/theme';
import { useAuthStore } from '../../services/authStore';
import { useCartStore } from '../../services/cartStore';
import { getProducts } from '../../services/api';

interface Product {
  id: number;
  name: string;
  price: string | number;
  category?: string;
  image_url?: string;
  barcode?: string;
  stock?: number;
}

const CATEGORIES = ['Todos', 'Bebidas', 'Snacks', 'Lacteos', 'Carnes', 'Frutas'];

export default function HomeScreen() {
  const { user } = useAuthStore();
  const { addItem, count } = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (category?: string) => {
    try {
      const normalized = category && category !== 'Todos' ? category.toLowerCase() : undefined;
      const res = await getProducts(1, normalized);
      setProducts(res.data.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProducts(selectedCategory);
  };

  const handleCategory = (category: string) => {
    setSelectedCategory(category);
    setLoading(true);
    loadProducts(category);
  };

  const handleAddToCart = async (product: Product) => {
    await addItem(product.id);
  };

  const firstName = user?.name?.split(' ')[0] || 'Cliente';

  return (
    <ScreenWrapper>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.eyebrow}>Rapid Inn</Text>
              <Text style={styles.heroTitle}>Hola, {firstName}</Text>
              <Text style={styles.heroSubtitle}>
                Compra rapido, paga sin friccion y controla tu acceso desde una sola app.
              </Text>
            </View>
            <TouchableOpacity style={styles.profileBubble} onPress={() => router.push('/(app)/profile')}>
              <Text style={styles.profileInitial}>{firstName.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          <Card variant="elevated" style={styles.heroCard}>
            <View style={styles.heroCardRow}>
              <View>
                <Text style={styles.heroCardLabel}>Estado de cuenta</Text>
                <Text style={styles.heroCardValue}>{user?.verification_status === 'verified' ? 'Lista para ingresar' : 'Verificacion pendiente'}</Text>
              </View>
              <Badge
                variant={user?.verification_status === 'verified' ? 'verified' : 'pending'}
                label={user?.verification_status === 'verified' ? 'Verificada' : 'En proceso'}
              />
            </View>

            <View style={styles.metricGrid}>
              <MetricCard icon="bag-handle-outline" label="Carrito" value={`${count} item${count === 1 ? '' : 's'}`} />
              <MetricCard icon="qr-code-outline" label="Acceso" value="QR activo" />
            </View>
          </Card>
        </View>

        <View style={styles.actionsRow}>
          <QuickAction
            icon="scan-outline"
            label="Escanear"
            tone="primary"
            onPress={() => router.push('/(app)/scanner')}
          />
          <QuickAction
            icon="qr-code-outline"
            label="Acceso QR"
            tone="success"
            onPress={() => router.push('/(app)/qr-access')}
          />
          <QuickAction
            icon="wallet-outline"
            label="Pagar"
            tone="warning"
            onPress={() => router.push('/(app)/cart')}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Explorar categorias</Text>
            <Text style={styles.sectionHint}>Seed y escaneo en un solo flujo</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <TouchableOpacity
                  key={category}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => handleCategory(category)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Productos destacados</Text>
            <Button label="Ver carrito" variant="ghost" size="sm" fullWidth={false} onPress={() => router.push('/(app)/cart')} />
          </View>

          {loading ? (
            <View style={styles.grid}>
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonProductCard key={index} />
              ))}
            </View>
          ) : products.length === 0 ? (
            <Card>
              <EmptyState
                icon="📦"
                title="No hay productos para mostrar"
                subtitle="Prueba otra categoria o actualiza la pantalla."
              />
            </Card>
          ) : (
            <View style={styles.grid}>
              {products.map((product) => (
                <ProductTile key={product.id} product={product} onAdd={() => handleAddToCart(product)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

function QuickAction({
  icon,
  label,
  tone,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  tone: 'primary' | 'success' | 'warning';
  onPress: () => void;
}) {
  const toneMap = {
    primary: { bg: Colors.primaryLight, color: Colors.primary },
    success: { bg: Colors.successLight, color: Colors.success },
    warning: { bg: Colors.warningLight, color: Colors.warningDark },
  }[tone];

  return (
    <Card pressable onPress={onPress} style={styles.quickCard}>
      <View style={[styles.quickIconWrap, { backgroundColor: toneMap.bg }]}>
        <Ionicons name={icon} size={20} color={toneMap.color} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Card>
  );
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Ionicons name={icon} size={18} color={Colors.primary} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function ProductTile({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: () => void;
}) {
  return (
    <Card style={styles.productCard}>
      <View style={styles.productMedia}>
        {product.image_url ? (
          <Image source={{ uri: product.image_url }} style={styles.productImage} resizeMode="cover" />
        ) : (
          <Ionicons name="bag-handle-outline" size={28} color={Colors.primary} />
        )}
      </View>

      <View style={styles.productBody}>
        <Text style={styles.productCategory}>{product.category || 'General'}</Text>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.productPrice}>${Number(product.price).toFixed(2)}</Text>
      </View>

      <Button label="Agregar" size="sm" onPress={onAdd} />
    </Card>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: 110,
    gap: Spacing.lg,
  },
  hero: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    gap: Spacing.lg,
    ...Shadows.primaryGlow,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  eyebrow: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#fff',
    fontSize: FontSizes.display,
    fontWeight: FontWeights.extrabold,
    marginTop: 6,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: FontSizes.md,
    lineHeight: 22,
    marginTop: 6,
    maxWidth: 260,
  },
  profileBubble: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: '#fff',
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
  },
  heroCard: {
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  heroCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroCardLabel: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: FontWeights.bold,
  },
  heroCardValue: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.extrabold,
    marginTop: 4,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 6,
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  metricValue: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  quickIconWrap: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: {
    color: Colors.text,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.extrabold,
  },
  sectionHint: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  chipsRow: {
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  chipTextActive: {
    color: '#fff',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  productCard: {
    width: '47.5%',
    padding: Spacing.sm,
    gap: Spacing.sm,
  },
  productMedia: {
    height: 110,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productBody: {
    gap: 4,
    minHeight: 92,
  },
  productCategory: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: FontWeights.bold,
  },
  productName: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    lineHeight: 20,
  },
  productPrice: {
    color: Colors.primary,
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.extrabold,
  },
});
