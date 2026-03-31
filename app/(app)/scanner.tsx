import { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  SafeAreaView, Alert, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { getProductByBarcode } from '../../services/api';
import { useCartStore } from '../../services/cartStore';
import { Colors, Spacing, FontSizes, BorderRadius, Shadows } from '../../constants/theme';

interface ScannedProduct {
  id: number;
  name: string;
  price: string;
  category: string;
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<ScannedProduct | null>(null);
  const { addItem } = useCartStore();

  const handleBarcodeScan = async ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setLoading(true);
    try {
      const res = await getProductByBarcode(data);
      setProduct(res.data.data);
    } catch {
      Alert.alert('Producto no encontrado', `Código: ${data}`, [
        { text: 'OK', onPress: () => setScanned(false) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addItem(product.id);
      Alert.alert('✓ Agregado', `${product.name} fue agregado al carrito`, [
        { text: 'Seguir escaneando', onPress: () => { setProduct(null); setScanned(false); } },
        { text: 'Ver carrito', onPress: () => router.push('/(app)/cart') },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo agregar al carrito');
    }
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.emoji}>📷</Text>
          <Text style={styles.permTitle}>Cámara necesaria</Text>
          <Text style={styles.permSubtitle}>Para escanear productos necesitamos acceso a tu cámara</Text>
          <TouchableOpacity style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Permitir cámara</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={!scanned ? handleBarcodeScan : undefined}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'],
        }}
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>Escanear producto</Text>
            <TouchableOpacity onPress={() => router.push('/(app)/cart')} style={styles.cartBtn}>
              <Text style={styles.cartBtnText}>🛒</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
              {loading && (
                <View style={styles.scanLoading}>
                  <ActivityIndicator color={Colors.primary} size="large" />
                </View>
              )}
            </View>
            <Text style={styles.scanHint}>
              Apuntá al código de barras del producto
            </Text>
          </View>

          {/* Product card */}
          {product && !loading && (
            <View style={styles.productCard}>
              <View style={styles.productInfo}>
                <Text style={styles.productEmoji}>🛍️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCategory}>{product.category}</Text>
                </View>
                <Text style={styles.productPrice}>${parseFloat(product.price).toFixed(2)}</Text>
              </View>
              <View style={styles.productActions}>
                <TouchableOpacity
                  style={styles.scanAgainBtn}
                  onPress={() => { setProduct(null); setScanned(false); }}
                >
                  <Text style={styles.scanAgainText}>Otro producto</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.addCartBtn} onPress={handleAddToCart}>
                  <Text style={styles.addCartText}>+ Agregar al carrito</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: Spacing.lg, gap: Spacing.md,
  },
  emoji: { fontSize: 64 },
  permTitle: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.text },
  permSubtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center' },
  permBtn: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.xl, paddingVertical: 14, ...Shadows.md,
  },
  permBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
  overlay: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#fff', fontSize: FontSizes.xl, fontWeight: '700' },
  title: { color: '#fff', fontSize: FontSizes.lg, fontWeight: '700' },
  cartBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  cartBtnText: { fontSize: 24 },
  scanArea: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg,
  },
  scanFrame: {
    width: 260, height: 160, position: 'relative',
    alignItems: 'center', justifyContent: 'center',
  },
  corner: {
    position: 'absolute', width: 28, height: 28, borderColor: '#fff', borderRadius: 2,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLoading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 8,
  },
  scanHint: {
    color: '#fff', fontSize: FontSizes.md, fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowRadius: 4,
    textShadowOffset: { width: 0, height: 1 },
  },
  productCard: {
    backgroundColor: Colors.surface, borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg,
    ...Shadows.lg,
  },
  productInfo: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  productEmoji: { fontSize: 36 },
  productName: { fontSize: FontSizes.lg, fontWeight: '700', color: Colors.text },
  productCategory: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  productPrice: { fontSize: FontSizes.xl, fontWeight: '800', color: Colors.primary },
  productActions: { flexDirection: 'row', gap: Spacing.sm },
  scanAgainBtn: {
    flex: 1, borderRadius: BorderRadius.md, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.border,
  },
  scanAgainText: { color: Colors.text, fontWeight: '600' },
  addCartBtn: {
    flex: 2, backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: 14, alignItems: 'center', ...Shadows.md,
  },
  addCartText: { color: '#fff', fontWeight: '700', fontSize: FontSizes.md },
});
