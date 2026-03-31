import React, { useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable,
  StyleSheet, Animated, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSizes, FontWeights, Shadows, Layout, Durations } from '../../constants/theme';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  error?: string;
  hint?: string;
  disabled?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  style?: ViewStyle;
  maxLength?: number;
  returnKeyType?: any;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
}

export default function Input({
  label, value, onChangeText, placeholder, secureTextEntry,
  keyboardType, autoCapitalize, error, hint, disabled,
  multiline, numberOfLines, style, maxLength, returnKeyType,
  onSubmitEditing, autoFocus,
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const borderAnim = useRef(new Animated.Value(0)).current;

  const handleFocus = () => {
    setFocused(true);
    Animated.timing(borderAnim, {
      toValue: 1,
      duration: Durations.fast,
      useNativeDriver: false,
    }).start();
  };

  const handleBlur = () => {
    setFocused(false);
    Animated.timing(borderAnim, {
      toValue: 0,
      duration: Durations.fast,
      useNativeDriver: false,
    }).start();
  };

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? Colors.error : Colors.border, error ? Colors.error : Colors.borderFocus],
  });

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      <Animated.View
        style={[
          styles.inputWrapper,
          { borderColor },
          focused && styles.inputWrapperFocused,
          error && styles.inputWrapperError,
          disabled && styles.inputWrapperDisabled,
          multiline && { height: (numberOfLines || 3) * 24 + 24 },
        ]}
      >
        <TextInput
          style={[styles.input, multiline && styles.inputMultiline]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || `Ingresá ${label.toLowerCase()}`}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize || 'none'}
          editable={!disabled}
          multiline={multiline}
          numberOfLines={numberOfLines}
          maxLength={maxLength}
          returnKeyType={returnKeyType}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setShowPassword(v => !v)} style={styles.eyeBtn}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={focused ? Colors.primary : Colors.textMuted}
            />
          </Pressable>
        )}
        {!secureTextEntry && value.length > 0 && !error && focused && (
          <Ionicons name="checkmark-circle" size={18} color={Colors.success} style={styles.statusIcon} />
        )}
        {error && (
          <Ionicons name="alert-circle" size={18} color={Colors.error} style={styles.statusIcon} />
        )}
      </Animated.View>
      {error ? (
        <View style={styles.msgRow}>
          <Ionicons name="alert-circle-outline" size={13} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={styles.hintText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: Layout.borderWidth,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    minHeight: Layout.inputHeight,
    ...Shadows.xs,
  },
  inputWrapperFocused: {
    ...Shadows.sm,
  },
  inputWrapperError: {
    borderColor: Colors.error,
    backgroundColor: Colors.errorLight + '30',
  },
  inputWrapperDisabled: {
    backgroundColor: Colors.backgroundAlt,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: FontSizes.md,
    color: Colors.text,
    paddingVertical: 14,
  },
  inputMultiline: {
    paddingTop: 14,
    textAlignVertical: 'top',
  },
  eyeBtn: {
    padding: 4,
    marginLeft: 4,
  },
  statusIcon: {
    marginLeft: 8,
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  errorText: {
    fontSize: FontSizes.xs,
    color: Colors.error,
    fontWeight: FontWeights.medium,
  },
  hintText: {
    fontSize: FontSizes.xs,
    color: Colors.textMuted,
  },
});
