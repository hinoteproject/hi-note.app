// Hi-Note Theme — Knote Premium Style
export const Colors = {
  // Primary - Emerald Green
  primary: '#10B981',
  primaryLight: '#34D399',
  primaryDark: '#059669',
  primaryBg: '#ECFDF5',

  // Secondary - Cyan
  secondary: '#06B6D4',
  secondaryLight: '#22D3EE',
  secondaryBg: '#E0F7FA',

  // Accent - Violet (AI elements)
  purple: '#8B5CF6',
  purpleLight: '#A78BFA',
  purpleDark: '#7C3AED',
  purpleBg: '#F5F3FF',

  // Status
  success: '#10B981',
  successBg: '#ECFDF5',
  warning: '#F59E0B',
  warningBg: '#FFFBEB',
  error: '#EF4444',
  errorBg: '#FEF2F2',

  // Premium Gradients
  gradientStart: '#E0F2F1',
  gradientMid: '#E0F7FA',
  gradientEnd: '#F8FAFC',

  primaryGradientStart: '#10B981',
  primaryGradientEnd: '#059669',

  // Neutrals
  white: '#FFFFFF',
  background: '#F8FAFC',
  card: '#FFFFFF',

  // Text
  text: '#1E293B',
  textPrimary: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textLight: '#CBD5E1',
  textLink: '#10B981',

  // Borders
  border: '#E2E8F0',
  borderLight: '#F1F5F9',

  // Input
  inputBg: '#F8FAFC',

  // Aliases
  green: '#10B981',
  greenLight: '#34D399',
  greenBg: '#ECFDF5',
  blue: '#3B82F6',
  blueLight: '#60A5FA',
  red: '#EF4444',
  redBg: '#FEF2F2',
  orange: '#F59E0B',
  orangeBg: '#FFFBEB',
  gray: '#64748B',
};

// Premium Glass Morphism
export const Glass = {
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  medium: {
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  dark: {
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
};

// Premium Gradient Presets
export const Gradients = {
  primary: ['#10B981', '#059669'] as [string, string],
  primarySoft: ['#D1FAE5', '#A7F3D0'] as [string, string],
  purple: ['#8B5CF6', '#6366F1'] as [string, string],
  purpleSoft: ['#EDE9FE', '#DDD6FE'] as [string, string],
  sky: ['#E0F2FE', '#F0F9FF', '#F8FAFC'] as [string, string, string],
  warm: ['#FFF1F2', '#FCE7F3', '#E0F2FE'] as [string, string, string],
  sunset: ['#FEF3C7', '#FDE68A', '#FBBF24'] as [string, string, string],
  header: ['#ECFDF5', '#E0F7FA', '#F0F9FF'] as [string, string, string],
  dark: ['#0F172A', '#1E293B'] as [string, string],
  card: ['#FFFFFF', '#F8FAFC'] as [string, string],
};

export const Shadows = {
  sm: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  xl: {
    shadowColor: '#334155',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 16,
  },
  primary: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  purple: {
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  card: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  glow: {
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 0,
  },
};

export const Fonts = {
  xs: 10,
  sm: 12,
  base: 14,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  full: 9999,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  section: 48,
};
