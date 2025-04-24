// Enhanced validator.ts
import { ThemeColor, ThemeColors } from "../models/colors";
import { StoreConfig } from "../models/config";
import { ThemeDesign } from "../models/theme";

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class ConfigValidator {
  /**
   * Validates the app configuration
   *
   * @param config - The configuration to validate
   * @returns Validation result with status and any errors
   */
  validate(config: StoreConfig): ValidationResult {
    const errors: string[] = [];

    // Required fields validation
    if (!config.metadata.storeId) {
      errors.push("storeId is required");
    }

    if (!config.metadata.storeName) {
      errors.push("storeName is required");
    }

    // Check image URLs
    if (config.assets?.images) {
      for (const image of config.assets.images) {
        if (!this.isValidUrl(image.url)) {
          errors.push(`Image URL for ${image.name} must be a valid URL`);
        }
      }
    }

    // Validate design structure
    this.validateDesign(config.design, errors);

    // Validate callback URL if present
    if (
      config.metadata.callbackUrl &&
      !this.isValidUrl(config.metadata.callbackUrl)
    ) {
      errors.push("callbackUrl must be a valid URL");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates the entire design structure
   */
  private validateDesign(
    design: { theme: ThemeDesign } | undefined,
    errors: string[]
  ): void {
    if (!design) {
      errors.push("Design configuration is required");
      return;
    }

    if (!design.theme) {
      errors.push("Theme configuration is required");
      return;
    }

    // Validate theme colors
    this.validateThemeColors(design.theme.colors, errors);

    // Validate typography
    this.validateTypography(design.theme.typography, errors);

    // Validate spacing
    this.validateSpacing(design.theme.spacing, errors);

    // Validate components
    this.validateComponents(design.theme.components, errors);
  }

  /**
   * Validates typography configuration
   */
  private validateTypography(
    typography: ThemeDesign["typography"] | undefined,
    errors: string[]
  ): void {
    if (!typography) {
      errors.push("Typography configuration is required");
      return;
    }

    // Check for required font configurations
    if (!typography.primaryFont) {
      errors.push("Primary font is required in typography configuration");
    }

    // Validate font sizes
    if (!typography.fontSizes) {
      errors.push("Font sizes are required in typography configuration");
    } else {
      // Check for required font sizes
      const requiredFontSizes = ["regular", "medium"];
      for (const size of requiredFontSizes) {
        if (
          typography.fontSizes[size as keyof typeof typography.fontSizes] ===
          undefined
        ) {
          errors.push(
            `Font size '${size}' is required in typography configuration`
          );
        }
      }
    }
  }

  /**
   * Validates spacing configuration
   */
  private validateSpacing(
    spacing: ThemeDesign["spacing"] | undefined,
    errors: string[]
  ): void {
    if (!spacing) {
      errors.push("Spacing configuration is required");
      return;
    }

    // Check for required spacing sections
    if (!spacing.padding) {
      errors.push("Padding configuration is required in spacing");
    }

    if (!spacing.margin) {
      errors.push("Margin configuration is required in spacing");
    }

    if (!spacing.borderRadius) {
      errors.push("Border radius configuration is required in spacing");
    }

    // Validate specific padding values if they exist
    if (spacing.padding) {
      const requiredPaddings = ["small", "medium"];
      for (const pad of requiredPaddings) {
        if (
          spacing.padding[pad as keyof typeof spacing.padding] === undefined
        ) {
          errors.push(
            `Padding size '${pad}' is required in spacing configuration`
          );
        }
      }
    }

    // Validate specific margin values if they exist
    if (spacing.margin) {
      const requiredMargins = ["small", "medium"];
      for (const margin of requiredMargins) {
        if (
          spacing.margin[margin as keyof typeof spacing.margin] === undefined
        ) {
          errors.push(
            `Margin size '${margin}' is required in spacing configuration`
          );
        }
      }
    }

    // Validate border radius values if they exist
    if (spacing.borderRadius) {
      const requiredRadii = ["small", "medium"];
      for (const radius of requiredRadii) {
        if (
          spacing.borderRadius[radius as keyof typeof spacing.borderRadius] ===
          undefined
        ) {
          errors.push(
            `Border radius '${radius}' is required in spacing configuration`
          );
        }
      }
    }
  }

  /**
   * Validates component configurations
   */
  private validateComponents(
    components: ThemeDesign["components"] | undefined,
    errors: string[]
  ): void {
    if (!components) {
      errors.push("Components configuration is recommended");
      return;
    }

    // Define valid color keys
    const validColorKeys = [
      "background",
      "foreground",
      "primary",
      "primaryForeground",
      "secondary",
      "secondaryForeground",
      "accent",
      "accentForeground",
      "muted",
      "mutedForeground",
      "card",
      "cardForeground",
      "border",
      "input",
      "destructive",
      "destructiveForeground",
      "productCard",
    ];

    // Validate inputs configuration if present
    if (components.inputs) {
      if (components.inputs.borderRadius === undefined) {
        errors.push("Border radius is required for input components");
      }
    }

    // Validate button configurations
    const buttonTypes = [
      "elevatedButtons",
      "textButtons",
      "outlinedButtons",
    ] as const;

    for (const buttonType of buttonTypes) {
      // This ensures the type is narrowed to ButtonConfig
      const button = components[buttonType];

      if (button) {
        if (button.borderRadius === undefined) {
          errors.push(`Border radius is required for ${buttonType}`);
        }

        // Now TypeScript knows we're dealing with ButtonConfig which has disabledBackgroundColor
        if (button.disabledBackgroundColor !== undefined) {
          if (!validColorKeys.includes(button.disabledBackgroundColor)) {
            errors.push(
              `Invalid disabledBackgroundColor '${
                button.disabledBackgroundColor
              }' in ${buttonType}. Must be one of: ${validColorKeys.join(", ")}`
            );
          }
        }
      }
    }
  }
  /**
   * Validates all colors in both light and dark themes
   */
  private validateThemeColors(
    colors: ThemeColors | undefined,
    errors: string[]
  ): void {
    if (!colors) {
      errors.push("Theme colors configuration is required");
      return;
    }

    if (!colors.light) {
      errors.push("Light theme colors are required");
    } else {
      this.validateColorTheme(colors.light, "light", errors);
    }

    if (!colors.dark) {
      errors.push("Dark theme colors are required");
    } else {
      this.validateColorTheme(colors.dark, "dark", errors);
    }
  }

  /**
   * Validates all colors in a specific theme (light or dark)
   */
  private validateColorTheme(
    theme: ThemeColor,
    themeName: string,
    errors: string[]
  ): void {
    // Required color properties
    const requiredColors = [
      "background",
      "foreground",
      "primary",
      "primaryForeground",
      "secondary",
      "secondaryForeground",
      "accent",
      "muted",
      "border",
    ];

    // Check for missing required colors
    for (const colorName of requiredColors) {
      if (!theme[colorName as keyof ThemeColor]) {
        errors.push(
          `Missing required color '${colorName}' in ${themeName} theme`
        );
      }
    }

    // Validate hex color format for all defined colors
    const colorProperties = Object.entries(theme);
    for (const [property, colorValue] of colorProperties) {
      if (colorValue && !this.isValidHexColor(colorValue)) {
        errors.push(
          `Invalid color value for ${themeName}.${property}: ${colorValue}. Must be a valid hex color (e.g., #RRGGBB or #RGB).`
        );
      }
    }
  }

  /**
   * Checks if a string is a valid URL
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validates if the provided string is a proper hexadecimal color code
   */
  private isValidHexColor(color: string): boolean {
    // Check if the input is a string
    if (typeof color !== "string") {
      return false;
    }

    // Create a regular expression to match valid hex color patterns
    const hexColorRegex = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;

    // Test the color against the regex pattern
    return hexColorRegex.test(color);
  }
}
