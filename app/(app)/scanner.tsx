import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';

import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import { getProductByBarcode } from '../../services/api';
import { useCartStore } from '../../services/cartStore';
import { BorderRadius, Colors, FontFamilies, FontSizes, Shadows, Spacing, Typography } from '../../constants/theme';

interface Product {
  id: number;
  name: string;
  price: string;
  category: string;
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<Product | null>(null);
  const { addItem } = useCartStore();

  const handleScan = async ({ data }: { data: string }) => {
    if (scanned || loading) return;
    setScanned(true);
    setLoading(true);
    try {
      const res = await getProductByBarcode(data);
      setProduct(res.data.data);
    } catch {
      Toast.show({ type: 'error', text1: 'Producto no encontrado', text2: `Codigo: ${data}` });
      setTimeout(() => setScanned(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!product) return;
    await addItem(product.id);
    Toast.show({ type: 'success', text1: 'Agregado al carrito', text2: product.name });
    setProduct(null);
    setScanned(false);
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.permScreen}>
        <View style={styles.permContent}>
          <CardLike>
            <BrandMark align="center" size="md" subtitle="Escanea productos de forma simple y sin friccion dentro de tu recorrido." />
          </CardLike>
          <View style={styles.permIcon}>
            <Ionicons name="camera-outline" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.permTitle}>Camara necesaria</Text>
          <Text style={styles.permSubtitle}>Para escanear productos necesitamos acceso a tu camara.</Text>
          <Button label="Permitir camara" onPress={requestPermission} fullWidth={false} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView
        style={{ flex: 1 }}
        facing="back"
        onBarcodeScanned={!scanned ? handleScan : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128', 'code39', 'qr'] }}
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={22} color={Colors.textInverse} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Escanear producto</Text>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(app)/cart')}>
              <Ionicons name="cart-outline" size={22} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanBrand}>
              <BrandMark align="center" size="sm" variant="wordmark" />
            </View>
            <View style={styles.scanFrame}>
              {(['TL', 'TR', 'BL', 'BR'] as const).map((pos) => (
                <View key={pos} style={[styles.corner, cornerStyles[pos]]} />
              ))}
              {loading ? (
                <View style={styles.scanLoader}>
                  <ActivityIndicator color={Colors.primary} size="large" />
                </View>
              ) : null}
            </View>
            <Text style={styles.scanHint}>Apunta al codigo de barras del producto</Text>
          </View>

          {product ? (
            <View style={styles.productSheet}>
              <BrandMark align="center" size="md" subtitle="Listo para sumar al carrito." />
              <View style={styles.productRow}>
                <View style={styles.productEmoji}>
                  <Ionicons name="bag-handle-outline" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productCat}>{product.category}</Text>
                </View>
                <Text style={styles.productPrice}>${parseFloat(product.price).toFixed(2)}</Text>
              </View>
              <View style={styles.productActions}>
                <Button
                  label="Otro producto"
                  onPress={() => { setProduct(null); setScanned(false); }}
                  variant="outline"
                  size="md"
                  style={{ flex: 1 }}
                />
                <Button label="Agregar" onPress={handleAdd} size="md" style={{ flex: 2 }} />
              </View>
            </View>
          ) : null}
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  permScreen: { flex: 1, backgroundColor: Colors.background },
  permContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
  },
  heroCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
  },
  permIcon: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: Colors.primarySoftest,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  permTitle: {
    ...Typography.h3,
    fontSize: FontSizes.xl,
  },
  permSubtitle: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  overlay: { flex: 1, backgroundColor: 'rgba(33, 51, 40, 0.32)' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(33, 51, 40, 0.46)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.textInverse,
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.lg,
  },
  scanArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  scanBrand: {
    backgroundColor: 'rgba(251, 247, 239, 0.12)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  scanFrame: { width: 260, height: 160, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: Colors.accentLight, borderRadius: 3 },
  cTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLoader: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(246, 240, 229, 0.75)', borderRadius: 8 },
  scanHint: { color: Colors.textInverse, fontFamily: FontFamilies.body, fontSize: FontSizes.md },
  productSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
  },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  productEmoji: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: Colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: { fontSize: FontSizes.md, fontFamily: FontFamilies.body, color: Colors.text, fontWeight: '600' },
  productCat: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2, fontFamily: FontFamilies.body },
  productPrice: { fontSize: FontSizes.xl, color: Colors.primary, fontFamily: FontFamilies.editorial },
  productActions: { flexDirection: 'row', gap: Spacing.sm },
});

const cornerStyles = {
  TL: styles.cTL,
  TR: styles.cTR,
  BL: styles.cBL,
  BR: styles.cBR,
};

function CardLike({ children }: { children: React.ReactNode }) {
  return <View style={styles.heroCard}>{children}</View>;
}
