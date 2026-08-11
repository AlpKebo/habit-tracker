/**
 * One palette per colour scheme. Screens read these through `useTheme()` so a
 * component never has to branch on light/dark itself.
 */
export const Colors = {
  light: {
    background: '#F5F6FA',
    surface: '#FFFFFF',
    surfaceMuted: '#EEF0F6',
    border: '#E2E5EE',
    text: '#12141C',
    textSecondary: '#5C6275',
    textTertiary: '#8A90A2',
    accent: '#4C6FFF',
    accentSoft: '#E8ECFF',
    onAccent: '#FFFFFF',
    success: '#149B67',
    successSoft: '#E1F5EC',
    danger: '#DC3B4B',
    dangerSoft: '#FCE8EA',
    warning: '#C97A05',
    warningSoft: '#FDF0DC',
  },
  dark: {
    background: '#0D0F16',
    surface: '#171A24',
    surfaceMuted: '#1F2331',
    border: '#2A2F3F',
    text: '#F2F3F7',
    textSecondary: '#A6ACBE',
    textTertiary: '#767D91',
    accent: '#7B94FF',
    accentSoft: '#1F2745',
    onAccent: '#0D0F16',
    success: '#3FD39A',
    successSoft: '#12301F',
    danger: '#FF7484',
    dangerSoft: '#3A1A1F',
    warning: '#F0B24B',
    warningSoft: '#33260F',
  },
};

/** Both schemes expose the same keys; values are plain colour strings. */
export type ThemeColors = Record<keyof (typeof Colors)['light'], string>;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;
