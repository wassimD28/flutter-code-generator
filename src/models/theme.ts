import { ThemeColor, ThemeColors } from "./colors";

export interface InputConfig {
  padding?: {
    horizontal?: number;
    vertical?: number;
  };
  borderRadius?: number;
  filled?: boolean;
}

export interface ButtonConfig {
  borderRadius?: number;
  padding?: {
    horizontal?: number;
    vertical?: number;
  };
  disabledBackgroundColor?: keyof ThemeColor;
}

export interface ThemeComponentsConfig {
  inputs?: InputConfig;
  elevatedButtons?: ButtonConfig;
  textButtons?: ButtonConfig;
  outlinedButtons?: ButtonConfig;
}

export interface ThemeDesign {
  colors: ThemeColors;
  typography: {
    primaryFont?: string;
    secondaryFont?: string;
    fontSizes?: {
      small?: number;
      regular?: number;
      medium?: number;
      large?: number;
      xLarge?: number;
      xxLarge?: number;
      xxxLarge?: number;
    };
  };
  spacing: {
    padding?: {
      small?: number;
      medium?: number;
      large?: number;
      xLarge?: number;
    };
    margin?: {
      small?: number;
      medium?: number;
      large?: number;
      xLarge?: number;
    };
    borderRadius?: {
      small?: number;
      medium?: number;
      large?: number;
      circular?: number;
    };
  };
  components?: ThemeComponentsConfig;
}