import React from 'react';
import { View, Pressable, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Shadows } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: number;
  style?: ViewStyle;
  pressable?: boolean;
}

export default function Card({
  children, onPress, variant = 'default', padding = 16, style, pressable,
}: CardProps) {
  const scale = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, speed: 50, bounciness: 0 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 3 }).start();
  };

  const cardStyle = [
    styles.base,
    styles[`variant_${variant}`],
    { padding },
    style,
  ];

  if (onPress || pressable) {
    return (
      <Animated.View style={{ transform: [{ scale }] }}>
        <Pressable
          onPress={onPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={cardStyle}
        >
          {children}
        </Pressable>
      </Animated.View>
    );
  }

  return <View style={cardStyle}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
  },
  variant_default: {
    ...Shadows.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  variant_elevated: {
    ...Shadows.md,
  },
  variant_outlined: {
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  variant_flat: {
    backgroundColor: Colors.backgroundAlt,
  },
});
