import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontSizes, FontWeights, Shadows, Spacing } from '../../constants/theme';
import { useCartStore } from '../../services/cartStore';
import { PaymentMethod, confirmManualPayment, createOrder, getPaymentStatus } from '../../services/api';

type Stage = 'summary' | 'paying' | 'success' | 'error';

const PAYMENT_OPTIONS: { id: PaymentMethod; title: string; body: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'mercadopago', title: 'Mercado Pago', body: 'Checkout externo rapido con confirmacion real del pago.', icon: 'wallet-outline' },
  { id: 'card', title: 'Tarjeta credito / debito', body: 'Confirmacion manual en app para demo retail.', icon: 'card-outline' },
  { id: 'expensas', title: 'Imputar a expensas', body: 'Disponible para locales integrados en barrio privado.', icon: 'home-outline' },
];

export default function CheckoutScreen() {
  const { items, total, count, clearAll } = useCartStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('mercadopago');
  const [expensasUnit, setExpensasUnit] = useState('');
  const [stage, setStage] = useState<Stage>('summary');
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('Revisa el metodo seleccionado o intenta nuevamente.');

  const canContinue = useMemo(() => {
    if (selectedMethod === 'expensas') {
      return expensasUnit.trim().length > 0;
    }

    return items.length > 0;
  }, [expensasUnit, items.length, selectedMethod]);

  useEffect(() => {
    if (stage !== 'paying' || !orderId) return;

    const interval = setInterval(() => {
      void checkPaymentStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [orderId, stage]);

  const openMercadoPago = async (url: string) => {
    if (!url) return;

    if (Platform.OS === 'web') {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    await WebBrowser.openBrowserAsync(url);
  };

  const checkPaymentStatus = async (showLoader = false) => {
    if (!orderId) return false;

    if (showLoader) {
      setCheckingPayment(true);
    }

    try {
      const statusRes = await getPaymentStatus(orderId);
      const paymentData = statusRes.data.data;

      if (paymentData?.paid) {
        await clearAll();
        setStage('success');
        return true;
      }

      if (paymentData?.status === 'cancelled' || paymentData?.mp_status === 'rejected') {
        setErrorMessage('Mercado Pago informo que la operacion fue rechazada o cancelada.');
        setStage('error');
        return false;
      }
    } catch {
      if (showLoader) {
        setErrorMessage('No pudimos confirmar el estado del pago. Intenta nuevamente en unos segundos.');
      }
    } finally {
      if (showLoader) {
        setCheckingPayment(false);
      }
    }

    return false;
  };

  const handleCheckout = async () => {
    setLoading(true);
    setErrorMessage('Revisa el metodo seleccionado o intenta nuevamente.');

    try {
      const res = await createOrder(selectedMethod, expensasUnit.trim() || undefined);
      const createdOrder = res.data.data.order;
      const payment = res.data.data.payment;

      setOrderId(createdOrder.id);

      if (selectedMethod === 'mercadopago') {
        const url = payment?.init_point || payment?.sandbox_init_point;

        if (!url) {
          throw new Error('No se recibio la URL de Mercado Pago.');
        }

        setPaymentUrl(url);
        setStage('paying');
        await openMercadoPago(url);
      } else {
        await confirmManualPayment(createdOrder.id);
        await clearAll();
        setStage('success');
      }
    } catch (error: any) {
      setErrorMessage(error?.response?.data?.message || error?.response?.data?.error || error?.message || 'No pudimos iniciar el pago.');
      setStage('error');
    } finally {
      setLoading(false);
    }
  };

  if (stage === 'paying') {
    return (
      <ScreenWrapper style={styles.centerContent}>
        <Card variant="elevated" style={styles.stateCard}>
          <View style={styles.stateIconInfo}>
            <Ionicons name="wallet-outline" size={28} color="#fff" />
          </View>
          <Text style={styles.stateTitle}>Continua el pago en Mercado Pago</Text>
          <Text style={styles.stateBody}>
            Abrimos el checkout en otra ventana. Cuando termines, vuelve aqui y confirma el estado de la compra.
          </Text>
          <View style={styles.waitingBox}>
            <ActivityIndicator size="small" color={Colors.primary} />
            <Text style={styles.waitingText}>Esperando confirmacion del pago...</Text>
          </View>
          <Button label="Ya pague" onPress={() => checkPaymentStatus(true)} loading={checkingPayment} />
          <Button label="Abrir Mercado Pago otra vez" variant="outline" onPress={() => openMercadoPago(paymentUrl)} />
          <TouchableOpacity onPress={() => setStage('summary')}>
            <Text style={styles.backToSummary}>Cambiar metodo de pago</Text>
          </TouchableOpacity>
        </Card>
      </ScreenWrapper>
    );
  }

  if (stage === 'success') {
    return (
      <ScreenWrapper style={styles.centerContent}>
        <Card variant="elevated" style={styles.stateCard}>
          <View style={styles.stateIconSuccess}>
            <Ionicons name="checkmark" size={28} color="#fff" />
          </View>
          <Text style={styles.stateTitle}>Pago confirmado</Text>
          <Text style={styles.stateBody}>
            Tu compra quedo registrada. Ahora ya puedes escanear el QR de salida.
          </Text>
          <Button label="Escanear QR de salida" onPress={() => router.replace(`/(app)/qr-access?mode=exit&orderId=${orderId || ''}`)} />
          <Button label="Volver al inicio" variant="outline" onPress={() => router.replace('/(app)/home')} />
        </Card>
      </ScreenWrapper>
    );
  }

  if (stage === 'error') {
    return (
      <ScreenWrapper style={styles.centerContent}>
        <Card variant="elevated" style={styles.stateCard}>
          <View style={styles.stateIconError}>
            <Ionicons name="close" size={28} color="#fff" />
          </View>
          <Text style={styles.stateTitle}>No pudimos completar el pago</Text>
          <Text style={styles.stateBody}>{errorMessage}</Text>
          <Button label="Reintentar" onPress={() => setStage('summary')} />
        </Card>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>Volver</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Confirmar compra</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card variant="elevated" style={styles.heroCard}>
            <Text style={styles.heroLabel}>Resumen</Text>
            <Text style={styles.heroAmount}>${Number(total).toFixed(2)}</Text>
            <Text style={styles.heroHint}>{count} productos listos para checkout</Text>
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Tu compra</Text>
            {items.map((item) => (
              <View key={item.id} style={styles.lineItem}>
                <View style={styles.lineBody}>
                  <Text style={styles.lineName}>{item.product.name}</Text>
                  <Text style={styles.lineMeta}>x{item.quantity}</Text>
                </View>
                <Text style={styles.linePrice}>
                  ${(item.quantity * Number(item.product.price || 0)).toFixed(2)}
                </Text>
              </View>
            ))}
          </Card>

          <Card>
            <Text style={styles.sectionTitle}>Metodo de pago</Text>
            <View style={styles.optionList}>
              {PAYMENT_OPTIONS.map((option) => {
                const active = selectedMethod === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionCard, active && styles.optionCardActive]}
                    onPress={() => setSelectedMethod(option.id)}
                  >
                    <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                      <Ionicons name={option.icon} size={18} color={active ? '#fff' : Colors.primary} />
                    </View>
                    <View style={styles.optionBody}>
                      <Text style={styles.optionTitle}>{option.title}</Text>
                      <Text style={styles.optionText}>{option.body}</Text>
                    </View>
                    <View style={[styles.radio, active && styles.radioActive]} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {selectedMethod === 'expensas' && (
              <Input
                label="Unidad o lote"
                value={expensasUnit}
                onChangeText={setExpensasUnit}
                placeholder="Ej: Lote 18 - Casa 4"
                hint="Se usara para imputar la compra a expensas."
              />
            )}
          </Card>
        </ScrollView>

        <View style={styles.footer}>
          <Card variant="elevated" style={styles.footerCard}>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Total a pagar</Text>
              <Text style={styles.footerValue}>${Number(total).toFixed(2)}</Text>
            </View>
            <Button
              label={selectedMethod === 'mercadopago' ? 'Continuar a Mercado Pago' : 'Confirmar pago'}
              onPress={handleCheckout}
              loading={loading}
              disabled={!canContinue}
            />
          </Card>
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 48,
  },
  backText: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.extrabold,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 180,
    gap: Spacing.md,
  },
  heroCard: {
    backgroundColor: Colors.primary,
    ...Shadows.primaryGlow,
  },
  heroLabel: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroAmount: {
    color: '#fff',
    fontSize: 42,
    fontWeight: FontWeights.extrabold,
    marginTop: 8,
  },
  heroHint: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: FontSizes.md,
    marginTop: 6,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.extrabold,
    marginBottom: Spacing.md,
  },
  lineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  lineBody: {
    flex: 1,
    gap: 2,
  },
  lineName: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  lineMeta: {
    color: Colors.textMuted,
    fontSize: FontSizes.xs,
  },
  linePrice: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  optionList: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  optionCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.backgroundAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: {
    backgroundColor: Colors.primary,
  },
  optionBody: {
    flex: 1,
    gap: 4,
  },
  optionTitle: {
    color: Colors.text,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
  optionText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radioActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 92,
    paddingHorizontal: Spacing.md,
  },
  footerCard: {
    gap: Spacing.md,
    ...Shadows.lg,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    color: Colors.textSecondary,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  footerValue: {
    color: Colors.text,
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
  },
  centerContent: {
    padding: Spacing.md,
    justifyContent: 'center',
  },
  stateCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  stateIconSuccess: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateIconError: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateIconInfo: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    color: Colors.text,
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
    textAlign: 'center',
  },
  stateBody: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  waitingBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primaryLight,
  },
  waitingText: {
    color: Colors.primaryDark,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  backToSummary: {
    color: Colors.primary,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
  },
});
