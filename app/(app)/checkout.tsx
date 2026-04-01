import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import BrandMark from '../../components/ui/BrandMark';
import Card from '../../components/ui/Card';
import ScreenWrapper from '../../components/ui/ScreenWrapper';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Shadows, Spacing, Typography } from '../../constants/theme';
import { useCartStore } from '../../services/cartStore';
import { DirectPaymentProvider, PaymentMethod, confirmManualPayment, createOrder, getPaymentStatus } from '../../services/api';

type Stage = 'summary' | 'paying' | 'success' | 'error';

const PAYMENT_METHOD_OPTIONS: { id: PaymentMethod; title: string; body: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'DIRECT', title: 'Pago directo', body: 'Cobro inmediato para mantener el flujo rapido de compra y salida por QR.', icon: 'flash-outline' },
  { id: 'EXPENSE', title: 'Imputar a expensas', body: 'El consumo se registra al lote y queda incluido en la liquidacion mensual.', icon: 'home-outline' },
];

const DIRECT_PROVIDER_OPTIONS: { id: DirectPaymentProvider; title: string; body: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'MERCADOPAGO', title: 'Mercado Pago', body: 'Checkout externo con confirmacion real del pago.', icon: 'wallet-outline' },
  { id: 'CARD', title: 'Tarjeta credito / debito', body: 'Confirmacion manual en app para demo retail.', icon: 'card-outline' },
];

export default function CheckoutScreen() {
  const { width } = useWindowDimensions();
  const isWide = width >= 960;
  const isTablet = width >= 720;
  const { items, total, count, clearAll } = useCartStore();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('DIRECT');
  const [selectedProvider, setSelectedProvider] = useState<DirectPaymentProvider>('MERCADOPAGO');
  const [stage, setStage] = useState<Stage>('summary');
  const [loading, setLoading] = useState(false);
  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('Revisa el metodo seleccionado o intenta nuevamente.');

  const canContinue = useMemo(() => {
    return items.length > 0;
  }, [items.length]);

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
      const res = await createOrder(
        selectedMethod,
        selectedMethod === 'DIRECT' ? selectedProvider : undefined,
      );
      const createdOrder = res.data.data.order;
      const payment = res.data.data.payment;

      setOrderId(createdOrder.id);

      if (selectedMethod === 'DIRECT' && selectedProvider === 'MERCADOPAGO') {
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
      <ScreenWrapper>
        <ScrollView contentContainerStyle={[styles.centerContent, isWide && styles.centerWide]} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={[styles.stateCard, isWide && styles.stateCardWide]}>
          <BrandMark align="center" size="sm" />
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
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (stage === 'success') {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={[styles.centerContent, isWide && styles.centerWide]} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={[styles.stateCard, isWide && styles.stateCardWide]}>
          <BrandMark align="center" size="sm" />
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
        </ScrollView>
      </ScreenWrapper>
    );
  }

  if (stage === 'error') {
    return (
      <ScreenWrapper>
        <ScrollView contentContainerStyle={[styles.centerContent, isWide && styles.centerWide]} showsVerticalScrollIndicator={false}>
        <Card variant="elevated" style={[styles.stateCard, isWide && styles.stateCardWide]}>
          <BrandMark align="center" size="sm" />
          <View style={styles.stateIconError}>
            <Ionicons name="close" size={28} color="#fff" />
          </View>
          <Text style={styles.stateTitle}>No pudimos completar el pago</Text>
          <Text style={styles.stateBody}>{errorMessage}</Text>
          <Button label="Reintentar" onPress={() => setStage('summary')} />
        </Card>
        </ScrollView>
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

        <ScrollView contentContainerStyle={[styles.content, isWide && styles.contentWide]} showsVerticalScrollIndicator={false}>
          <Card variant="elevated" style={[styles.heroCard, isWide && styles.wideCard]}>
            <BrandMark align="center" size="md" subtitle="Tu compra conserva el flujo simple: eliges como pagar y luego sales con QR." />
            <Text style={styles.heroLabel}>Resumen</Text>
            <Text style={styles.heroAmount}>${Number(total).toFixed(2)}</Text>
            <Text style={styles.heroHint}>{count} productos listos para checkout</Text>
          </Card>

          <Card style={isWide && styles.wideCard}>
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

          <Card style={isWide && styles.wideCard}>
            <Text style={styles.sectionTitle}>Liquidacion</Text>
            <View style={styles.optionList}>
              {PAYMENT_METHOD_OPTIONS.map((option) => {
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

            {selectedMethod === 'DIRECT' ? (
              <>
                <Text style={styles.sectionTitleSecondary}>Proveedor de cobro</Text>
                <View style={styles.optionList}>
                  {DIRECT_PROVIDER_OPTIONS.map((option) => {
                    const active = selectedProvider === option.id;
                    return (
                      <TouchableOpacity
                        key={option.id}
                        style={[styles.optionCard, active && styles.optionCardActive]}
                        onPress={() => setSelectedProvider(option.id)}
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
              </>
            ) : (
                <Card variant="flat" style={styles.infoCard}>
                <Text style={styles.infoTitle}>Cargo al lote actual</Text>
                <Text style={styles.infoText}>
                  Si tu lote y tu perfil tienen permiso, el consumo quedara incluido en la liquidacion mensual de expensas.
                </Text>
              </Card>
            )}
          </Card>

          <View style={[styles.footerInline, isWide && styles.wideCard]}>
            <Card variant="elevated" style={styles.footerCard}>
            <View style={styles.footerRow}>
              <Text style={styles.footerLabel}>Total a pagar</Text>
              <Text style={styles.footerValue}>${Number(total).toFixed(2)}</Text>
            </View>
            <Button
              label={
                selectedMethod === 'DIRECT' && selectedProvider === 'MERCADOPAGO'
                  ? 'Continuar a Mercado Pago'
                  : selectedMethod === 'EXPENSE'
                    ? 'Imputar a expensas'
                    : 'Confirmar pago'
              }
              onPress={handleCheckout}
              loading={loading}
              disabled={!canContinue}
            />
            </Card>
          </View>
        </ScrollView>
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
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  headerTitle: {
    ...Typography.h3,
    fontSize: FontSizes.lg,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 120,
    gap: Spacing.md,
    flexGrow: 1,
  },
  contentWide: {
    alignItems: 'center',
  },
  heroCard: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.lg,
    width: '100%',
  },
  heroLabel: {
    color: Colors.primarySoft,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  heroAmount: {
    color: Colors.primary,
    fontFamily: FontFamilies.editorial,
    fontSize: 42,
    marginTop: 8,
    textAlign: 'center',
  },
  heroHint: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    marginTop: 6,
    textAlign: 'center',
  },
  sectionTitle: {
    ...Typography.h3,
    fontSize: FontSizes.lg,
    marginBottom: Spacing.md,
  },
  sectionTitleSecondary: {
    color: Colors.text,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
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
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  lineMeta: {
    color: Colors.textMuted,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
  },
  linePrice: {
    color: Colors.text,
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.md,
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
    borderColor: Colors.primarySoft,
    backgroundColor: Colors.primarySoftest,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surfaceMuted,
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
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  optionText: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
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
  infoCard: {
    gap: Spacing.xs,
  },
  infoTitle: {
    color: Colors.text,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  infoText: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
  footer: {
    display: 'none',
  },
  footerInline: {
    width: '100%',
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
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.xxl,
  },
  centerContent: {
    padding: Spacing.md,
    justifyContent: 'center',
    flexGrow: 1,
  },
  centerWide: {
    alignItems: 'center',
  },
  stateCard: {
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    width: '100%',
  },
  stateCardWide: {
    maxWidth: 760,
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
    ...Typography.h2,
    textAlign: 'center',
  },
  stateBody: {
    color: Colors.textSecondary,
    fontFamily: FontFamilies.body,
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
    backgroundColor: Colors.primarySoftest,
  },
  waitingText: {
    color: Colors.primary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  backToSummary: {
    color: Colors.primary,
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
  },
  wideCard: {
    width: '100%',
    maxWidth: 1120,
  },
});
