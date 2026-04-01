import React from 'react';
import { Image, ImageStyle, StyleProp, StyleSheet, Text, View, ViewStyle, useWindowDimensions } from 'react-native';
import { BorderRadius, Colors, FontFamilies, FontSizes, Spacing, Typography } from '../../constants/theme';

interface BrandMarkProps {
  style?: StyleProp<ViewStyle>;
  align?: 'left' | 'center';
  invert?: boolean;
  size?: 'sm' | 'md' | 'lg';
  subtitle?: string;
  variant?: 'logo' | 'wordmark';
}

const logoAsset = require('../../assets/images/market-house-logo.png');

const SIZE_MAP = {
  sm: {
    width: 132,
    market: 12,
    house: 32,
    tracking: 4,
  },
  md: {
    width: 188,
    market: 14,
    house: 44,
    tracking: 5,
  },
  lg: {
    width: 240,
    market: 16,
    house: 58,
    tracking: 6,
  },
};

export default function BrandMark({
  style,
  align = 'left',
  invert = false,
  size = 'md',
  subtitle,
  variant = 'logo',
}: BrandMarkProps) {
  const token = SIZE_MAP[size];
  const { width } = useWindowDimensions();
  const isCompact = width < 430;
  const maxLogoWidth = Math.min(width - 48, width < 768 ? width * 0.76 : width * 0.28);
  const preferredLogoWidth = token.width + (isCompact ? 28 : 0);
  const resolvedLogoWidth = Math.min(maxLogoWidth, Math.max(size === 'sm' ? 140 : size === 'md' ? 210 : 280, preferredLogoWidth));
  const subtitleMaxWidth = Math.min(width - 48, width < 768 ? 360 : 540);
  const alignment = align === 'center' ? 'center' : 'flex-start';
  const textAlign = align === 'center' ? 'center' : 'left';
  const subtitleColor = invert ? 'rgba(251,247,239,0.84)' : Colors.textSecondary;

  return (
    <View style={[styles.container, { alignItems: alignment }, style]}>
      {variant === 'logo' ? (
        <View style={[styles.logoFrame, invert && styles.logoFrameInvert]}>
          <Image source={logoAsset} style={[styles.logo, { width: resolvedLogoWidth } as ImageStyle]} resizeMode="contain" />
        </View>
      ) : (
        <View style={{ alignItems: alignment }}>
          <Text style={[styles.market, { fontSize: token.market, letterSpacing: token.tracking, textAlign }]}>MARKET</Text>
          <Text style={[styles.house, { fontSize: token.house, lineHeight: token.house * 0.96, textAlign, color: invert ? Colors.textInverse : Colors.primary }]}>
            House
          </Text>
        </View>
      )}
      {subtitle ? <Text style={[styles.subtitle, { color: subtitleColor, textAlign, maxWidth: subtitleMaxWidth }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  logoFrame: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xl,
    alignSelf: 'flex-start',
  },
  logoFrameInvert: {
    backgroundColor: 'rgba(251,247,239,0.14)',
  },
  logo: {
    height: undefined,
    aspectRatio: 1152 / 768,
  },
  market: {
    ...Typography.marketLabel,
  },
  house: {
    fontFamily: FontFamilies.brand,
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    lineHeight: 20,
  },
});
