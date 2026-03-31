import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Colors = {
  primary: '#5B5BD6',
  primaryDark: '#4747B5',
  primaryDarker: '#363694',
  primaryLight: '#EDEDFB',
  primaryMid: '#7C7CE3',
  gradientStart: '#5B5BD6',
  gradientEnd: '#8B5CF6',
  gradientDark: '#3D3D9E',
  secondary: '#06B6D4',
  secondaryLight: '#E0F7FA',
  success: '#10B981',
  successDark: '#059669',
  successLight: '#D1FAE5',
  error: '#EF4444',
  errorDark: '#DC2626',
  errorLight: '#FEE2E2',
  warning: '#F59E0B',
  warningDark: '#D97706',
  warningLight: '#FEF3C7',
  info: '#3B82F6',
  infoLight: '#DBEAFE',
  background: '#F5F7FA',
  backgroundAlt: '#EEF0F5',
  surface: '#FFFFFF',
  overlay: 'rgba(15, 23, 42, 0.5)',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#5B5BD6',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textDisabled: '#CBD5E1',
  textInverse: '#FFFFFF',
  textLink: '#5B5BD6',
  verified: '#10B981',
  verifiedLight: '#D1FAE5',
  pending: '#F59E0B',
  pendingLight: '#FEF3C7',
  unverified: '#94A3B8',
  unverifiedLight: '#F1F5F9',
  skeletonBase: '#E2E8F0',
  skeletonHighlight: '#F8FAFC',
  transparent: 'transparent',
};

export const Gradients = {
  primary: ['#5B5BD6', '#8B5CF6'] as string[],
  primaryDark: ['#3D3D9E', '#5B5BD6'] as string[],
  success: ['#10B981', '#059669'] as string[],
  welcome: ['#1E1B4B', '#4C1D95', '#5B5BD6'] as string[],
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const FontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 30,
  display: 38,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const Shadows = {
  none: {},
  xs: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryGlow: {
    shadowColor: '#5B5BD6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const Layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  contentPadding: Spacing.md,
  inputHeight: 52,
  buttonHeight: 52,
  borderWidth: 1.5,
};

export const Durations = {
  fast: 150,
  normal: 250,
  slow: 400,
};
