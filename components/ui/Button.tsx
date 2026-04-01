import React, { useRef } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  StyleProp,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { BorderRadius, Colors, FontFamilies, FontSizes, FontWeights, Layout, Shadows } from '../../constants/theme';

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
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = true,
  icon,
  iconPosition = 'left',
  style,
  textStyle,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 42,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      speed: 28,
      bounciness: 4,
    }).start();
  };

  const isDisabled = disabled || loading;

  return (
    <Animated.View style={{ transform: [{ scale }], ...(fullWidth ? {} : { alignSelf: 'flex-start' }) }}>
      <Pressable
        onPress={isDisabled ? undefined : onPress}
        onPressIn={isDisabled ? undefined : handlePressIn}
        onPressOut={isDisabled ? undefined : handlePressOut}
        style={[
          styles.base,
          styles[`size_${size}`],
          styles[`variant_${variant}`],
          (variant === 'primary' || variant === 'success') && !isDisabled && Shadows.primaryGlow,
          isDisabled && styles.disabled,
          !fullWidth && styles.inline,
          style,
        ]}
        accessibilityRole="button"
        accessibilityState={{ disabled: isDisabled, busy: loading }}
      >
        {loading ? (
          <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? Colors.primary : Colors.textInverse} size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && icon}
            <Text style={[styles.label, styles[`labelSize_${size}`], styles[`labelVariant_${variant}`], isDisabled && styles.labelDisabled, textStyle]}>
              {label}
            </Text>
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
    borderRadius: BorderRadius.lg,
    gap: 8,
  },
  inline: { alignSelf: 'flex-start' },
  disabled: { opacity: 0.48 },
  size_sm: { height: 42, paddingHorizontal: 16 },
  size_md: { height: Layout.buttonHeight, paddingHorizontal: 22 },
  size_lg: { height: 60, paddingHorizontal: 26, borderRadius: BorderRadius.xl },
  variant_primary: { backgroundColor: Colors.primary },
  variant_secondary: { backgroundColor: Colors.primarySoft },
  variant_outline: {
    backgroundColor: Colors.surface,
    borderWidth: Layout.borderWidth,
    borderColor: Colors.border,
  },
  variant_ghost: { backgroundColor: Colors.surfaceMuted },
  variant_danger: { backgroundColor: Colors.error },
  variant_success: { backgroundColor: Colors.success },
  label: {
    fontFamily: FontFamilies.body,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.2,
  },
  labelSize_sm: { fontSize: FontSizes.sm },
  labelSize_md: { fontSize: FontSizes.md },
  labelSize_lg: { fontSize: FontSizes.lg },
  labelVariant_primary: { color: Colors.textInverse },
  labelVariant_secondary: { color: Colors.textInverse },
  labelVariant_outline: { color: Colors.primary },
  labelVariant_ghost: { color: Colors.text },
  labelVariant_danger: { color: Colors.textInverse },
  labelVariant_success: { color: Colors.textInverse },
  labelDisabled: {},
});
