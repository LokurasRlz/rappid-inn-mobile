import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  withFade?: boolean;
  withSlide?: boolean;
  backgroundColor?: string;
}

export default function ScreenWrapper({
  children,
  style,
  edges = ['top', 'bottom'],
  withFade = true,
  withSlide = true,
  backgroundColor = Colors.background,
}: ScreenWrapperProps) {
  const fadeAnim = useRef(new Animated.Value(withFade ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(withSlide ? 18 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 14, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor }]} edges={edges}>
      <Animated.View
        style={[
          styles.inner,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          style,
        ]}
      >
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  inner: { flex: 1 },
});
