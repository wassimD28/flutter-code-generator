export interface ThemeColor {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  accent: string;
  accentForeground: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  border: string;
  input: string;
  destructive: string;
  destructiveForeground: string;
  productCard: string;
}

export interface ThemeColors {
  light: ThemeColor;
  dark: ThemeColor;
}
