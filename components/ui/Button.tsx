import React, { useRef } from 'react';
import {
  Pressable, Text, StyleSheet, ActivityIndicator,
  Animated, ViewStyle, TextStyle,
} from 'react-native';
import { Colors, BorderRadius, FontSizes, FontWeights, Shadows, Layout, Durations } from '../../constants/theme';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export default function Button({
  label, onPress, variant = 'primary', size = 'md',
  loading = false, disabled = false, fullWidth = true,
  icon, iconPosition = 'left', style, textStyle,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 30,
      bounciness: 4,
    }).start();
  };

  const isDisabled = disabled || loading;

  const containerStyle = [
    styles.base,
    styles[`size_${size}`],
    styles[`variant_${variant}`],
    isDisabled && styles.disabled,
    !fullWidth && styles.inline,
    variant === 'primary' && !isDisabled && Shadows.primaryGlow,
    style,
  ];

  const labelStyle = [
    styles.label,
    styles[`labelSize_${size}`],
    styles[`labelVariant_${variant}`],
    isDisabled && styles.labelDisabled,
    textStyle,
  ];

  return (
    <Animated.View style={{ transform: [{ scale }], ...(fullWidth ? {} : { alignSelf: 'flex-start' }) }}>
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={isDisabled ? undefined : handlePressIn}
        onPressOut={isDisabled ? undefined : handlePressOut}
        style={containerStyle}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator
            color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.textInverse}
            size="small"
          />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            <Text style={labelStyle}>{label}</Text>
            {icon && iconPosition === 'right' && icon}
          </>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
    gap: 8,
  },
  inline: { alignSelf: 'flex-start' },
  disabled: { opacity: 0.45 },

  // Sizes
  size_sm: { height: 40, paddingHorizontal: 16 },
  size_md: { height: Layout.buttonHeight, paddingHorizontal: 20 },
  size_lg: { height: 58, paddingHorizontal: 24, borderRadius: BorderRadius.lg },

  // Variants
  variant_primary: { backgroundColor: Colors.primary },
  variant_secondary: { backgroundColor: Colors.secondary },
  variant_outline: {
    backgroundColor: Colors.transparent,
    borderWidth: Layout.borderWidth,
    borderColor: Colors.primary,
  },
  variant_ghost: { backgroundColor: Colors.primaryLight },
  variant_danger: { backgroundColor: Colors.error },
  variant_success: { backgroundColor: Colors.success },

  // Labels base
  label: { fontWeight: FontWeights.bold, letterSpacing: 0.2 },

  // Label sizes
  labelSize_sm: { fontSize: FontSizes.sm },
  labelSize_md: { fontSize: FontSizes.md },
  labelSize_lg: { fontSize: FontSizes.lg },

  // Label variants
  labelVariant_primary: { color: Colors.textInverse },
  labelVariant_secondary: { color: Colors.textInverse },
  labelVariant_outline: { color: Colors.primary },
  labelVariant_ghost: { color: Colors.primary },
  labelVariant_danger: { color: Colors.textInverse },
  labelVariant_success: { color: Colors.textInverse },
  labelDisabled: {},
});
