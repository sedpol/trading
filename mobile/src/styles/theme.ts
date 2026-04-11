import { DefaultTheme, type Theme } from '@react-navigation/native';
import { Platform } from 'react-native';

export const colors = {
  background: '#f4efe6',
  surface: '#fffaf2',
  surfaceMuted: '#efe4d2',
  border: '#d7c6ad',
  text: '#182338',
  textMuted: '#5f6a7d',
  primary: '#c45c2f',
  primaryPressed: '#9f4a24',
  accent: '#17324d',
  success: '#0f7a53',
  danger: '#aa3c3c',
  warning: '#8d5c13',
  chip: '#efe2cf',
};

export const fonts = {
  body: Platform.select({ android: 'sans-serif', default: 'System', ios: 'Avenir Next' }),
  display: Platform.select({ android: 'serif', default: 'System', ios: 'Avenir Next Demi Bold' }),
};

export const navigationTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    border: colors.border,
    card: colors.surface,
    notification: colors.primary,
    primary: colors.primary,
    text: colors.text,
  },
};