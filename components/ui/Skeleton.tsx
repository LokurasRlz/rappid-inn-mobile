import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '../../constants/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = BorderRadius.sm, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        { width: width as any, height, borderRadius, backgroundColor: Colors.skeletonBase, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <Skeleton width={80} height={80} borderRadius={BorderRadius.md} />
      <View style={styles.cardBody}>
        <Skeleton height={14} width="70%" />
        <Skeleton height={12} width="40%" style={{ marginTop: 6 }} />
        <Skeleton height={10} width="55%" style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SkeletonProductCard() {
  return (
    <View style={styles.productCard}>
      <Skeleton height={90} borderRadius={BorderRadius.md} />
      <Skeleton height={12} width="80%" style={{ marginTop: 10 }} />
      <Skeleton height={12} width="50%" style={{ marginTop: 6 }} />
      <Skeleton height={34} borderRadius={BorderRadius.sm} style={{ marginTop: 10 }} />
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={{ gap: 12 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 12,
  },
  cardBody: { flex: 1, gap: 0, justifyContent: 'center' },
  productCard: {
    width: '47%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
});
