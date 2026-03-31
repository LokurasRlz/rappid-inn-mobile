import { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { WebView } from 'react-native-webview';

import { Colors, Spacing, FontSizes, BorderRadius } from '../../constants/theme';
import { useCartStore } from '../../services/cartStore';
import {
  PaymentMethod,
  confirmManualPayment,
  createOrder,
  getPaymentStatus,
} from '../../services/api';

type Stage = 'summary' | 'paying' | 'success' | 'error';

const PAYMENT_OPTIONS: { id: PaymentMethod; title: string; description: string }[] = [
  { id: 'mercadopago', title: 'Mercado Pago', description: 'Checkout externo con preferencia de pago.' },
  { id: 'card', title: 'Tarjeta credito/debito', description: 'Confirmacion directa dentro de la app para demo.' },
  { id: 'expensas', title: 'Imputar a expensas', description: 'Solo para locales en barrio privado.' },
];

export default function CheckoutScreen() {
  const { items, total, count, clearAll } = useCartStore();

  const [stage, setStage] = useState<Stage>('summary');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mercadopago');
  const [expensasUnit, setExpensasUnit] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);

  const canSubmit = useMemo(() => {
    if (selectedMethod === 'expensas') {
      return expensasUnit.trim().length > 0;
    }

    return true;
  }, [expensasUnit, selectedMethod]);

  const handleCreatePayment = async () => {
    if (!items.length) {
      Alert.alert('Carrito vacio', 'Agrega productos antes de pagar.');
      return;
    }

    if (!canSubmit) {
      Alert.alert('Falta informacion', 'Indica la unidad o lote para imputar a expensas.');
      return;
    }

    setLoading(true);

    try {
      const res = await createOrder(selectedMethod, expensasUnit.trim() || undefined);
      const createdOrder = res.data.data.order;
      const paymentData = res.data.data.payment;

      setOrderId(createdOrder.id);

      if (selectedMethod === 'mercadopago') {
        const url = paymentData?.init_point || paymentData?.sandbox_init_point;

        if (!url) {
          throw new Error('No se recibio la URL de pago de Mercado Pago.');
        }

        setPaymentUrl(url);
        setStage('paying');
      } else {
        await confirmManualPayment(createdOrder.id);
        await clearAll();
        setStage('success');
      }
    } catch (error: any) {
      Alert.alert('Error', error?.response?.data?.error || error?.message || 'No se pudo iniciar el pago.');
      setStage('error');
    } finally {
      setLoading(false);
    }
  };

  const handleNavigationChange = async (navState: { url?: string }) => {
    const url = navState.url || '';

    if (!orderId) return;

    if (url.includes('success') || url.includes('approved') || url.includes('payment_id')) {
      try {
        const statusRes = await getPaymentStatus(orderId);
        const paid = statusRes.data.data?.paid;

        if (paid) {
          await clearAll();
          setStage('success');
          return;
        }
      } catch {
        // Ignore polling failure and continue to success fallback below.
      }

      await clearAll();
      setStage('success');
    }

    if (url.includes('failure') || url.includes('rejected')) {
      setStage('error');
    }
  };

  if (stage === 'paying') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setStage('summary')}>
            <Text style={styles.headerBack}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pago Mercado Pago</Text>
          <View style={{ width: 50 }} />
        </View>
        <WebView
          source={{ uri: paymentUrl }}
          startInLoadingState
          renderLoading={() => (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
          )}
          onNavigationStateChange={handleNavigationChange}
        />
      </View>
    );
  }

  if (stage === 'success') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.successTitle}>Pago confirmado</Text>
        <Text style={styles.successText}>
          La transaccion se registro correctamente. Ahora puedes escanear el QR de salida.
        </Text>
        <TouchableOpacity
          style={styles.primaryAction}
          onPress={() => router.replace(`/(app)/qr-access?mode=exit&orderId=${orderId || ''}`)}
        >
          <Text style={styles.primaryActionText}>Escanear QR de salida</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction} onPress={() => router.replace('/(app)/home')}>
          <Text style={styles.secondaryActionText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (stage === 'error') {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.successTitle}>No se pudo completar el pago</Text>
        <Text style={styles.successText}>
          Revisa el metodo elegido o intenta nuevamente.
        </Text>
        <TouchableOpacity style={styles.primaryAction} onPress={() => setStage('summary')}>
          <Text style={styles.primaryActionText}>Intentar nuevamente</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.headerBack}>Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pago</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Resumen de compra</Text>
          {items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.product.name}</Text>
              <Text style={styles.itemMeta}>x{item.quantity}</Text>
              <Text style={styles.itemPrice}>
                ${(item.quantity * Number(item.product.price || 0)).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total ({count} items)</Text>
            <Text style={styles.totalAmount}>${Number(total).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Metodo de pago</Text>
          {PAYMENT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedMethod === option.id && styles.optionCardActive,
              ]}
              onPress={() => setSelectedMethod(option.id)}
            >
              <View style={styles.optionHeader}>
                <View style={[styles.radio, selectedMethod === option.id && styles.radioActive]} />
                <Text style={styles.optionTitle}>{option.title}</Text>
              </View>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </TouchableOpacity>
          ))}

          {selectedMethod === 'expensas' && (
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Unidad / lote</Text>
              <TextInput
                style={styles.input}
                value={expensasUnit}
                onChangeText={setExpensasUnit}
                placeholder="Ej: Lote 18 - Casa 4"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.primaryAction, (!canSubmit || loading) && { opacity: 0.6 }]}
          onPress={handleCreatePayment}
          disabled={!canSubmit || loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryActionText}>
              {selectedMethod === 'mercadopago' ? 'Continuar a Mercado Pago' : 'Confirmar pago'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    paddingTop: 56,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  headerBack: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: '800',
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  itemName: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '600',
  },
  itemMeta: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  itemPrice: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  totalAmount: {
    fontSize: FontSizes.xl,
    color: Colors.text,
    fontWeight: '800',
  },
  optionCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 6,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  radio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radioActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  optionTitle: {
    fontSize: FontSizes.md,
    color: Colors.text,
    fontWeight: '700',
  },
  optionDescription: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
  },
  field: {
    gap: 6,
    marginTop: Spacing.sm,
  },
  fieldLabel: {
    fontSize: FontSizes.sm,
    color: Colors.text,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: Colors.text,
    fontSize: FontSizes.md,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#fff',
    fontSize: FontSizes.md,
    fontWeight: '800',
  },
  secondaryAction: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.sm,
  },
  secondaryActionText: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: '700',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successTitle: {
    fontSize: FontSizes.xxl,
    color: Colors.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  successText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginVertical: Spacing.lg,
    lineHeight: 22,
  },
});
