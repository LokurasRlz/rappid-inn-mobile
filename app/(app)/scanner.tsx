import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Toast from 'react-native-toast-message';
import Button from '../../components/ui/Button';
import { getProductByBarcode } from '../../services/api';
import { useCartStore } from '../../services/cartStore';
import { Colors, Spacing, FontSizes, FontWeights, BorderRadius, Shadows } from '../../constants/theme';

interface Product { id: number; name: string; price: string; category: string; }

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
      Toast.show({ type: 'error', text1: 'Producto no encontrado', text2: `Código: ${data}` });
      setTimeout(() => setScanned(false), 2000);
    } finally { setLoading(false); }
  };

  const handleAdd = async () => {
    if (!product) return;
    await addItem(product.id);
    Toast.show({ type: 'success', text1: '✓ Agregado al carrito', text2: product.name });
    setProduct(null);
    setScanned(false);
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={styles.permScreen}>
        <View style={styles.permContent}>
          <View style={styles.permIcon}><Ionicons name="camera-outline" size={48} color={Colors.primary} /></View>
          <Text style={styles.permTitle}>Cámara necesaria</Text>
          <Text style={styles.permSubtitle}>Para escanear productos necesitamos acceso a tu cámara</Text>
          <Button label="Permitir cámara" onPress={requestPermission} fullWidth={false} />
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
        barcodeScannerSettings={{ barcodeTypes: ['ean13','ean8','upc_a','upc_e','code128','code39','qr'] }}
      >
        <SafeAreaView style={styles.overlay}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Escanear producto</Text>
            <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/(app)/cart')}>
              <Ionicons name="cart-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.scanArea}>
            <View style={styles.scanFrame}>
              {['TL','TR','BL','BR'].map(pos => (
                <View key={pos} style={[styles.corner, styles[`c${pos}` as any]]} />
              ))}
              {loading && (
                <View style={styles.scanLoader}>
                  <ActivityIndicator color={Colors.primary} size="large" />
                </View>
              )}
            </View>
            <Text style={styles.scanHint}>Apuntá al código de barras del producto</Text>
          </View>

          {product && (
            <View style={styles.productSheet}>
              <View style={styles.productRow}>
                <View style={styles.productEmoji}><Text style={{ fontSize: 28 }}>🛍️</Text></View>
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
                <Button
                  label="+ Agregar"
                  onPress={handleAdd}
                  size="md"
                  style={{ flex: 2 }}
                />
              </View>
            </View>
          )}
        </SafeAreaView>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  permScreen: { flex: 1, backgroundColor: Colors.background },
  permContent: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.xl, gap: Spacing.md },
  permIcon: { width: 96, height: 96, borderRadius: 28, backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  permTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.extrabold, color: Colors.text },
  permSubtitle: { fontSize: FontSizes.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: FontSizes.lg, fontWeight: FontWeights.bold },
  scanArea: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.lg },
  scanFrame: { width: 260, height: 160, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#fff', borderRadius: 3 },
  cTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLoader: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 8 },
  scanHint: { color: 'rgba(255,255,255,0.85)', fontSize: FontSizes.md, fontWeight: FontWeights.medium },
  productSheet: { backgroundColor: Colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, gap: Spacing.md, ...Shadows.lg },
  productRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  productEmoji: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.backgroundAlt, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.text },
  productCat: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginTop: 2 },
  productPrice: { fontSize: FontSizes.xl, fontWeight: FontWeights.extrabold, color: Colors.primary },
  productActions: { flexDirection: 'row', gap: Spacing.sm },
});
