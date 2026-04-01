import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights } from '../../constants/theme';

type BadgeVariant = 'verified' | 'pending' | 'unverified' | 'success' | 'error' | 'warning' | 'info' | 'primary';

const BADGE_CONFIG: Record<BadgeVariant, { bg: string; color: string; icon: any }> = {
  verified:   { bg: Colors.verifiedLight,   color: Colors.verified,     icon: 'checkmark-circle' },
  pending:    { bg: Colors.pendingLight,    color: Colors.pending,      icon: 'time' },
  unverified: { bg: Colors.unverifiedLight, color: Colors.unverified,   icon: 'shield-outline' },
  success:    { bg: Colors.successLight,    color: Colors.success,      icon: 'checkmark-circle' },
  error:      { bg: Colors.errorLight,      color: Colors.error,        icon: 'close-circle' },
  warning:    { bg: Colors.warningLight,    color: Colors.warning,      icon: 'warning' },
  info:       { bg: Colors.infoLight,       color: Colors.info,         icon: 'information-circle' },
  primary:    { bg: Colors.primaryLight,    color: Colors.primary,      icon: 'ellipse' },
};

interface BadgeProps {
  variant: BadgeVariant;
  label: string;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

export default function Badge({ variant, label, showIcon = true, size = 'md' }: BadgeProps) {
  const config = BADGE_CONFIG[variant];
  const isSmall = size === 'sm';

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, isSmall && styles.badgeSm]}>
      {showIcon && (
        <Ionicons name={config.icon} size={isSmall ? 12 : 14} color={config.color} />
      )}
      <Text style={[styles.label, { color: config.color }, isSmall && styles.labelSm]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  labelSm: {
    fontSize: FontSizes.xs,
  },
});
