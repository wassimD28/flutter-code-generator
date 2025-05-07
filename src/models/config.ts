export interface ThemeColor {
  background: string;
  foreground: string;
  primary: string;
  primaryForeground: string;
  secondary?: string;
  secondaryForeground?: string;
  accent?: string;
  accentForeground?: string;
  muted: string;
  mutedForeground: string;
  card: string;
  cardForeground: string;
  border: string;
  input: string;
  inputForeground: string;
  destructive?: string;
  destructiveForeground?: string;
  productCard?: string;
}

// Interface for the direct light/dark theme structure in config.json
export interface DirectThemeColors {
  backgroundColor: string;
  foregroundColor: string;
  cardColor: string;
  cardForegroundColor: string;
  primaryColor: string;
  primaryForegroundColor: string;
  mutedColor: string;
  mutedForegroundColor: string;
  inputColor: string;
  inputForegroundColor: string;
  borderColor: string;
}

export interface StoreConfig {
  metadata: {
    storeId: string;
    storeName: string;
    description: string;
    storeSlogan: string;
    templateType: string;
    baseUrl: string;
  };
  app: {
    name: string;
    bundleId: string;
    version: {
      name: string;
      code: number;
    };
    supportedLocales: string[];
  };
  design: {
    radius: number;
    lightTheme: DirectThemeColors;
    darkTheme: DirectThemeColors;
  };
  splashScreen: {
    lightBackgroundColor: string;
    darkBackgroundColor: string;
  };
  features?: {
    [key: string]: {
      enabled: boolean;
      path: string;
      content?: any;
      screens?: any;
    };
  };
  projectStructure: {
    core: Array<{ name: string; path: string }>;
    services: Array<{ name: string; path: string }>;
    theme: Array<{ name: string; path: string }>;
    utils: Array<{ name: string; path: string }>;
    dependency_injection: Array<{ name: string; path: string }>;
    shared_controllers: Array<{ name: string; path: string }>;
    shared_widgets: Array<{ name: string; path: string }>;
    button_components: Array<{ name: string; path: string }>;
    controllers: Array<{ name: string; path: string }>;
    models: Array<{ name: string; path: string }>;
    repositories: Array<{ name: string; path: string }>;
    bindings: Array<{ name: string; path: string }>;
    screens: Array<{ name: string; path: string }>;
    widgets: Array<{ name: string; path: string }>;
    project_config: Array<{ name: string; path: string }>;
    entry: {
      name: string;
      path: string;
    };
  };
  assets?: {
    images: Array<{ name: string; url: string; path: string }>;
  };
}

// The processed config adds derived values
export interface ProcessedConfig extends StoreConfig {
  appName: string; // Derived from metadata.storeName
  welcomeMessage: string;
}

// Additional mapping function to convert DirectThemeColors to ThemeColor
export function convertDirectThemeToThemeColor(
  directTheme: DirectThemeColors
): ThemeColor {
  return {
    background: directTheme.backgroundColor,
    foreground: directTheme.foregroundColor,
    primary: directTheme.primaryColor,
    primaryForeground: directTheme.primaryForegroundColor,
    card: directTheme.cardColor,
    cardForeground: directTheme.cardForegroundColor,
    muted: directTheme.mutedColor,
    mutedForeground: directTheme.mutedForegroundColor,
    input: directTheme.inputColor,
    inputForeground: directTheme.inputForegroundColor,
    border: directTheme.borderColor,
    // Set default values for optional properties
    secondary: directTheme.cardColor, // Use card color as secondary by default
    secondaryForeground: directTheme.cardForegroundColor,
    accent: directTheme.primaryColor, // Use primary as accent by default
    accentForeground: directTheme.primaryForegroundColor,
    destructive: "#FF0000", // Default red for destructive
    destructiveForeground: "#FFFFFF", // Default white for destructive foreground
    productCard: directTheme.cardColor, // Use card color for product card by default
  };
}
