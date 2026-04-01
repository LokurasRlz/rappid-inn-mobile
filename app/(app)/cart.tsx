import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import EmptyState from '../../components/ui/EmptyState';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { SkeletonList } from '../../components/ui/Skeleton';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';
import { CartItem, useCartStore } from '../../services/cartStore';

export default function CartScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isTablet = width >= 720;
  const { items, total, count, isLoading, fetchCart, updateItem, removeItem, clearAll } = useCartStore();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdate = async (item: CartItem, quantity: number) => {
    if (quantity <= 0) {
      handleRemove(item.id);
      return;
    }

    setUpdatingId(item.id);
    try {
      await updateItem(item.id, quantity);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = (id: number) => {
    Alert.alert('Quitar producto', 'Se eliminara este producto del carrito.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeItem(id) },
    ]);
  };

  const handleClear = () => {
    Alert.alert('Vaciar carrito', 'Se eliminaran todos los productos actuales.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Vaciar', style: 'destructive', onPress: clearAll },
    ]);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {isLoading ? (
          <View style={styles.loaderWrap}>
            <SkeletonList count={3} />
          </View>
        ) : items.length === 0 ? (
          <Card style={styles.emptyCard}>
            <EmptyState
              icon="[]"
              title="Todavia no agregaste productos"
              subtitle="Escanea o agrega productos desde inicio para verlos aqui."
              actionLabel="Ir a escanear"
              onAction={() => router.push('/(app)/scanner')}
            />
          </Card>
        ) : (
          <>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={[styles.list, isWide && styles.listWide]}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={(
                <View style={[styles.header, isWide && styles.sectionWide]}>
                  <View style={styles.headerCopy}>
                    <Card variant="elevated" style={styles.heroCard}>
                      <BrandMark align="center" size={isTablet ? 'lg' : 'md'} subtitle="Revisa tus productos antes de pasar al pago." />
                    </Card>
                    <Text style={styles.headerTitle}>Tu carrito</Text>
                  </View>
                  {items.length > 0 ? (
                    <TouchableOpacity style={styles.headerAction} onPress={handleClear}>
                      <Text style={styles.headerActionText}>Vaciar</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
              ListFooterComponent={(
                <View style={[styles.footerInline, isWide && styles.sectionWide]}>
                  <Card variant="elevated" style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Productos</Text>
                      <Text style={styles.summaryValue}>{count}</Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Total</Text>
                      <Text style={styles.summaryTotal}>${total.toFixed(2)}</Text>
                    </View>
                    <Button label="Continuar al pago" onPress={() => router.push('/(app)/checkout')} />
                  </Card>
                </View>
              )}
              renderItem={({ item }) => (
                <CartRow
                  item={item}
                  busy={updatingId === item.id}
                  onIncrease={() => handleUpdate(item, item.quantity + 1)}
                  onDecrease={() => handleUpdate(item, item.quantity - 1)}
                  onRemove={() => handleRemove(item.id)}
                />
              )}
            />
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

function CartRow({
  item,
  busy,
  onIncrease,
  onDecrease,
  onRemove,
}: {
  item: CartItem;
  busy: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  onRemove: () => void;
}) {
  const subtotal = Number(item.product.price || 0) * item.quantity;

  return (
    <Card style={styles.rowCard}>
      <View style={styles.rowMedia}>
        {item.product.image_url ? (
          <Image source={{ uri: item.product.image_url }} style={styles.rowImage} resizeMode="cover" />
        ) : (
          <Ionicons name="bag-handle-outline" size={24} color={Colors.primary} />
        )}
      </View>

      <View style={styles.rowBody}>
        <Text style={styles.rowName} numberOfLines={2}>{item.product.name}</Text>
        <Text style={styles.rowMeta}>${Number(item.product.price).toFixed(2)} c/u</Text>
        <Text style={styles.rowPrice}>${subtotal.toFixed(2)}</Text>
      </View>

      <View style={styles.stepper}>
        <TouchableOpacity style={styles.stepperBtn} onPress={onDecrease}>
          <Ionicons name="remove" size={16} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepperValue}>{busy ? '...' : item.quantity}</Text>
        <TouchableOpacity style={styles.stepperBtn} onPress={onIncrease}>
          <Ionicons name="add" size={16} color={Colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.removeBtn} onPress={onRemove}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  headerCopy: {
    flex: 1,
    gap: Spacing.sm,
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
  },
  headerTitle: {
    ...Typography.h2,
    paddingHorizontal: Spacing.xs,
  },
  headerAction: {
    backgroundColor: Colors.errorLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  headerActionText: {
    color: Colors.errorDark,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  loaderWrap: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  emptyCard: {
    marginHorizontal: Spacing.md,
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.md,
    flexGrow: 1,
  },
  listWide: {
    alignItems: 'center',
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    width: '100%',
    maxWidth: 1120,
  },
  rowMedia: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  rowImage: {
    width: '100%',
    height: '100%',
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowName: {
    color: Colors.text,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    lineHeight: 20,
  },
  rowMeta: {
    color: Colors.textMuted,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
  rowPrice: {
    color: Colors.primary,
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.xl,
  },
  stepper: {
    alignItems: 'center',
    gap: 8,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValue: {
    color: Colors.text,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    minWidth: 28,
    textAlign: 'center',
  },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerInline: {
    width: '100%',
    marginTop: Spacing.md,
  },
  summaryCard: {
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    ...Shadows.lg,
    width: '100%',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  summaryValue: {
    color: Colors.text,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  summaryTotal: {
    color: Colors.text,
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.xxl,
  },
  sectionWide: {
    width: '100%',
    maxWidth: 1120,
  },
});
