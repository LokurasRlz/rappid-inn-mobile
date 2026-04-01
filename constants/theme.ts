import { Dimensions, Platform, TextStyle } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export const Colors = {
  primary: '#234936',
  primaryDark: '#173629',
  primarySoft: '#6F8A69',
  primarySoftest: '#DCE4D6',
  primaryLight: '#DCE4D6',
  accent: '#C9B268',
  accentDark: '#A78E46',
  accentLight: '#F1E7C2',
  success: '#5E815C',
  successDark: '#456445',
  successLight: '#E2EDDD',
  error: '#A45548',
  errorDark: '#834138',
  errorLight: '#F4E4DF',
  warning: '#B68C43',
  warningDark: '#8A682F',
  warningLight: '#F3E8CB',
  info: '#799685',
  infoLight: '#E5ECE6',
  background: '#F6F0E5',
  backgroundAlt: '#EFE5D4',
  surface: '#FBF7EF',
  surfaceMuted: '#F1EBDC',
  overlay: 'rgba(21, 34, 26, 0.42)',
  border: '#D8CCB6',
  borderLight: '#E9DFCF',
  borderFocus: '#6F8A69',
  text: '#213328',
  textSecondary: '#58685D',
  textMuted: '#8A8A77',
  textDisabled: '#B5B3A7',
  textInverse: '#FBF7EF',
  textLink: '#234936',
  verified: '#5E815C',
  verifiedLight: '#E2EDDD',
  pending: '#B68C43',
  pendingLight: '#F3E8CB',
  unverified: '#8A8A77',
  unverifiedLight: '#ECE5D8',
  skeletonBase: '#E4DAC9',
  skeletonHighlight: '#F8F3EA',
  transparent: 'transparent',
  cameraOverlay: 'rgba(24, 27, 22, 0.34)',
  white: '#FFFFFF',
};

export const Gradients = {
  primary: [Colors.primary, '#40644E'] as string[],
  hero: [Colors.background, '#F3EBDD'] as string[],
  accent: [Colors.accentLight, Colors.surface] as string[],
};

export const Spacing = {
  xxs: 2,
  xs: 6,
  sm: 10,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const FontSizes = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 30,
  xxxl: 38,
  display: 52,
};

export const FontWeights = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const FontFamilies = {
  brand: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  editorial: Platform.select({
    ios: 'Georgia',
    android: 'serif',
    default: 'Georgia',
  }),
  body: Platform.select({
    ios: 'System',
    android: 'sans-serif',
    default: 'sans-serif',
  }),
  mono: Platform.select({
    ios: 'Courier',
    android: 'monospace',
    default: 'monospace',
  }),
};

export const Typography: Record<string, TextStyle> = {
  display: {
    fontFamily: FontFamilies.brand,
    fontSize: FontSizes.display,
    lineHeight: 58,
    letterSpacing: -1.4,
    color: Colors.text,
  },
  h1: {
    fontFamily: FontFamilies.brand,
    fontSize: FontSizes.xxxl,
    lineHeight: 44,
    letterSpacing: -0.8,
    color: Colors.text,
  },
  h2: {
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.xxl,
    lineHeight: 36,
    color: Colors.text,
  },
  h3: {
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.xl,
    lineHeight: 30,
    color: Colors.text,
  },
  body: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.md,
    lineHeight: 24,
    color: Colors.textSecondary,
  },
  bodySm: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  caption: {
    fontFamily: FontFamilies.body,
    fontSize: FontSizes.xs,
    lineHeight: 18,
    letterSpacing: 0.8,
    color: Colors.textMuted,
  },
  marketLabel: {
    fontFamily: FontFamilies.editorial,
    fontSize: FontSizes.sm,
    lineHeight: 20,
    letterSpacing: 5,
    color: Colors.primarySoft,
    textTransform: 'uppercase',
  },
};

export const BorderRadius = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  xxl: 36,
  full: 999,
};

export const Shadows = {
  none: {},
  xs: {
    shadowColor: '#3A433B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#3A433B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  md: {
    shadowColor: '#3A433B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 5,
  },
  lg: {
    shadowColor: '#3A433B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.1,
    shadowRadius: 26,
    elevation: 8,
  },
  primaryGlow: {
    shadowColor: '#7E8D6A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 10,
  },
};

export const Layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  contentPadding: Spacing.md,
  inputHeight: 56,
  buttonHeight: 56,
  borderWidth: 1.2,
};

export const Durations = {
  fast: 150,
  normal: 250,
  slow: 400,
};
