// Enhanced validator.ts
import { ThemeColor, ThemeColors } from "../models/colors";
import { DirectThemeColors, StoreConfig } from "../models/config";
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
    design: { theme: DirectThemeColors } | undefined,
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

 
}
