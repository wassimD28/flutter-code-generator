/**
 * QuickBuildConfig interface represents the simplified configuration format
 * used for quick store generation
 */
export interface QuickBuildConfig {
  buildType: "quick_build";
  storeId: string;
  appName: string;
  appDescription: string;
  appSlogan: string;
  type: "fashion" | "electronic" | "shoes";
  radius: 0 | 5 | 10 | 15 | 100;
  lightColors: {
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
  };
  darkColors: {
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
  };
  lightIconUrl: string;
  darkIconUrl: string;
  splashScreen: {
    lightBackgroundColor: string;
    darkBackgroundColor: string;
  };
}