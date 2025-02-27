import { StoreConfig } from "../models/config";

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

    // Required fields
    if (!config.storeId) {
      errors.push("storeId is required");
    }

    if (!config.storeName) {
      errors.push("storeName is required");
    }

    // Validate URLs if present
    if (config.logoUrl && !this.isValidUrl(config.logoUrl)) {
      errors.push("logoUrl must be a valid URL");
    }

    // Check for color validity if present
    if (config.primaryColor && !this.isValidColor(config.primaryColor)) {
      errors.push("primaryColor must be a valid Flutter color");
    }

    // Validate callback URL if present
    if (config.callbackUrl && !this.isValidUrl(config.callbackUrl)) {
      errors.push("callbackUrl must be a valid URL");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
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
   * Checks if the provided color is a valid Flutter color
   * This is a simplified implementation - would need to be expanded
   * with actual Flutter color names
   */
  private isValidColor(color: string): boolean {
    const validColors = [
      "blue",
      "red",
      "green",
      "yellow",
      "purple",
      "pink",
      "orange",
      "teal",
      "cyan",
      "amber",
      "indigo",
      "lime",
      "brown",
      "grey",
      "black",
    ];

    return validColors.includes(color);
  }
}
