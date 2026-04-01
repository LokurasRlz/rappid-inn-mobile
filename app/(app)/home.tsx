import { useEffect, useState } from 'react';
import {
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Badge from '../../components/ui/Badge';
import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { SkeletonProductCard } from '../../components/ui/Skeleton';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';
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
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isTablet = width >= 720;
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
        contentContainerStyle={[styles.content, isWide && styles.contentWide]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      >
        <View style={[styles.hero, isWide && styles.sectionWide]}>
          <View style={[styles.heroTop, isTablet && styles.heroTopWide]}>
            <BrandMark
              variant="logo"
              size={isTablet ? 'lg' : 'md'}
              subtitle={`Hola, ${firstName}. Todo listo para comprar y moverte dentro del barrio con una experiencia tranquila.`}
            />
            <TouchableOpacity style={styles.profileBubble} onPress={() => router.push('/(app)/profile')}>
              <Text style={styles.profileInitial}>{firstName.charAt(0).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>

          <Card variant="elevated" style={styles.statusCard}>
            <View style={[styles.statusRow, !isTablet && styles.statusRowStack]}>
              <View>
                <Text style={styles.statusLabel}>Estado de cuenta</Text>
                <Text style={styles.statusValue}>
                  {user?.verification_status === 'verified' ? 'Lista para entrar' : 'Verificacion pendiente'}
                </Text>
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

        <View style={[styles.actionsRow, isWide && styles.sectionWide, !isTablet && styles.actionsColumn]}>
          <QuickAction icon="scan-outline" label="Escanear" tone="primary" onPress={() => router.push('/(app)/scanner')} />
          <QuickAction icon="qr-code-outline" label="Acceso QR" tone="success" onPress={() => router.push('/(app)/qr-access')} />
          <QuickAction icon="wallet-outline" label="Pagar" tone="warning" onPress={() => router.push('/(app)/cart')} />
        </View>

        <View style={[styles.section, isWide && styles.sectionWide]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categorias</Text>
            <Text style={styles.sectionHint}>Compra simple, siempre disponible</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {CATEGORIES.map((category) => {
              const active = selectedCategory === category;
              return (
                <TouchableOpacity key={category} style={[styles.chip, active && styles.chipActive]} onPress={() => handleCategory(category)}>
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{category}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={[styles.section, isWide && styles.sectionWide]}>
          <View style={[styles.sectionHeader, !isTablet && styles.sectionHeaderStack]}>
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
                icon="[]"
                title="No hay productos para mostrar"
                subtitle="Prueba otra categoria o actualiza la pantalla."
              />
            </Card>
          ) : (
            <View style={[styles.grid, isTablet && styles.gridWide]}>
              {products.map((product) => (
                <ProductTile key={product.id} product={product} onAdd={() => handleAddToCart(product)} cardStyle={isTablet ? styles.productCardWide : undefined} />
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
    primary: { bg: Colors.primarySoftest, color: Colors.primary },
    success: { bg: Colors.successLight, color: Colors.successDark },
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
  cardStyle,
}: {
  product: Product;
  onAdd: () => void;
  cardStyle?: any;
}) {
  return (
    <Card style={[styles.productCard, cardStyle]}>
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
    flexGrow: 1,
  },
  contentWide: {
    alignItems: 'center',
  },
  hero: {
    gap: Spacing.md,
    width: '100%',
  },
  sectionWide: {
    width: '100%',
    maxWidth: 1120,
  },
  heroTop: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xxl,
    padding: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
    ...Shadows.lg,
  },
  heroTopWide: {
    alignItems: 'center',
  },
  profileBubble: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  profileInitial: {
    color: Colors.primary,
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.lg,
  },
  statusCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  statusRowStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  statusLabel: {
    color: Colors.primarySoft,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: FontWeights.bold,
  },
  statusValue: {
    ...Typography.h3,
    fontSize: FontSizes.xl,
    marginTop: 4,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metricCard: {
    flex: 1,
    backgroundColor: Colors.surfaceMuted,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: 6,
  },
  metricLabel: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  metricValue: {
    color: Colors.text,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  actionsColumn: {
    flexDirection: 'column',
  },
  quickCard: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
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
    fontFamily: FontFamilies.body,
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
  sectionHeaderStack: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: FontSizes.xl,
  },
  sectionHint: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
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
    backgroundColor: Colors.primarySoftest,
    borderColor: Colors.primarySoft,
  },
  chipText: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  chipTextActive: {
    color: Colors.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  gridWide: {
    justifyContent: 'flex-start',
  },
  productCard: {
    width: '47.5%',
    padding: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
  },
  productCardWide: {
    width: '31.5%',
  },
  productMedia: {
    height: 110,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceMuted,
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
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: FontWeights.bold,
  },
  productName: {
    color: Colors.text,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    lineHeight: 20,
  },
  productPrice: {
    color: Colors.primary,
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.xl,
  },
});
