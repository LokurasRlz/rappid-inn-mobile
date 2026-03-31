import { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useCartStore, CartItem } from '../../services/cartStore';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';

export default function CartScreen() {
  const { items, summary, isLoading, fetchCart, fetchSummary, updateItem, removeItem, clearAll } = useCartStore();
  const [updating, setUpdating] = useState<number | null>(null);

  useEffect(() => {
    fetchCart();
    fetchSummary();
  }, []);

  const handleUpdate = async (id: number, quantity: number) => {
    if (quantity < 1) {
      handleRemove(id);
      return;
    }
    setUpdating(id);
    try {
      await updateItem(id, quantity);
      await fetchCart();
      await fetchSummary();
    } catch {}
    setUpdating(null);
  };

  const handleRemove = (id: number) => {
    Alert.alert('Eliminar', '¿Quitar este producto del carrito?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive',
        onPress: async () => {
          await removeItem(id);
          await fetchCart();
          await fetchSummary();
        },
      },
    ]);
  };

  const handleClear = () => {
    Alert.alert('Vaciar carrito', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Vaciar', style: 'destructive',
        onPress: async () => { await clearAll(); },
      },
    ]);
  };

  const renderItem = ({ item }: { item: CartItem }) => (
    <View style={styles.item}>
      <View style={styles.itemImage}>
        <Text style={{ fontSize: 28 }}>🛍️</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
        <Text style={styles.itemPrice}>
          ${(Number(item.product.price) * item.quantity).toFixed(2)}
        </Text>
        <Text style={styles.itemUnitPrice}>
          ${Number(item.product.price).toFixed(2)} c/u
        </Text>
      </View>
      <View style={styles.itemQty}>
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => handleUpdate(item.id, item.quantity - 1)}
          disabled={updating === item.id}
        >
          <Text style={styles.qtyBtnText}>−</Text>
        </TouchableOpacity>
        {updating === item.id
          ? <ActivityIndicator size="small" color={Colors.primary} />
          : <Text style={styles.qtyValue}>{item.quantity}</Text>
        }
        <TouchableOpacity
          style={styles.qtyBtn}
          onPress={() => handleUpdate(item.id, item.quantity + 1)}
          disabled={updating === item.id}
        >
          <Text style={styles.qtyBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Mi carrito</Text>
        {items.length > 0 && (
          <TouchableOpacity onPress={handleClear}>
            <Text style={styles.clearText}>Vaciar</Text>
          </TouchableOpacity>
        )}
      </View>

      {items.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🛒</Text>
          <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
          <Text style={styles.emptySubtitle}>Escaneá productos para agregarlos</Text>
          <TouchableOpacity style={styles.scanBtn} onPress={() => router.push('/(app)/scanner')}>
            <Text style={styles.scanBtnText}>Escanear productos</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            renderItem={renderItem}
            keyExtractor={item => String(item.id)}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                {summary?.items_count ?? items.length} productos
              </Text>
              <Text style={styles.summaryTotal}>
                ${summary?.total ?? '0.00'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => router.push('/(app)/checkout')}
            >
              <Text style={styles.checkoutBtnText}>Ir a pagar →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  title: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.text },
  clearText: { color: Colors.danger, fontSize: FontSizes.sm, fontWeight: '600' },
  list: { padding: Spacing.lg, gap: Spacing.md },
  item: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: BorderRadius.lg,
    padding: Spacing.md, ...Shadows.sm,
    borderWidth: 1, borderColor: Colors.borderLight,
    gap: Spacing.sm,
  },
  itemImage: {
    width: 56, height: 56, borderRadius: BorderRadius.md,
    backgroundColor: Colors.borderLight, alignItems: 'center', justifyContent: 'center',
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FontSizes.sm, fontWeight: '600', color: Colors.text },
  itemPrice: { fontSize: FontSizes.lg, fontWeight: '800', color: Colors.primary, marginTop: 2 },
  itemUnitPrice: { fontSize: FontSizes.xs, color: Colors.textMuted },
  itemQty: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  qtyBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  qtyBtnText: { color: Colors.primary, fontSize: FontSizes.lg, fontWeight: '800', lineHeight: 20 },
  qtyValue: { fontSize: FontSizes.md, fontWeight: '700', color: Colors.text, minWidth: 24, textAlign: 'center' },
  empty: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: { fontSize: 72 },
  emptyTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.text },
  emptySubtitle: { fontSize: FontSizes.md, color: Colors.textSecondary },
  scanBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: 14, marginTop: Spacing.sm, ...Shadows.md,
  },
  scanBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
  summary: {
    backgroundColor: Colors.surface, padding: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.lg,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: Spacing.md,
  },
  summaryLabel: { fontSize: FontSizes.md, color: Colors.textSecondary, fontWeight: '600' },
  summaryTotal: { fontSize: FontSizes.xxl, fontWeight: '800', color: Colors.text },
  checkoutBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 16, alignItems: 'center', ...Shadows.md,
  },
  checkoutBtnText: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
});
