import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Button from './Button';
import { Colors, FontFamilies, FontSizes, Spacing, Typography } from '../../constants/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <View style={styles.action}>
          <Button label={actionLabel} onPress={onAction} fullWidth={false} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  icon: { fontSize: 64, marginBottom: Spacing.sm },
  title: {
    ...Typography.h3,
    fontSize: FontSizes.xl,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  action: { marginTop: Spacing.md },
});
