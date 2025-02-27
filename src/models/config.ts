// Models the configuration received from GitHub Actions
export interface StoreConfig {
  jobId: string;
  storeId: string;
  storeName: string;
  description?: string;
  logoUrl?: string;
  primaryColor?: string;
  features?: string[];
  callbackUrl?: string;
  // Add other fields as needed
}

// Configuration with defaults applied
export interface ProcessedConfig extends StoreConfig {
  appName: string; // Derived from storeName
  welcomeMessage: string;
  // Other processed fields
}
