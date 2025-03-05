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
  
  projectStructure?: {
    controllers?: string[];
    screens?: string[];
    widgets?: string[];
    routes?: string[];
    models?: string[];
  };
}

// Configuration with defaults applied
export interface ProcessedConfig extends StoreConfig {
  appName: string; // Derived from storeName
  welcomeMessage: string;
  // Other processed fields
}

export enum ProjectStructure {
  CONTROLLERS = "lib/controllers",
  SCREENS = "lib/screens",
  WIDGETS = "lib/widgets",
  ROUTES = "lib/routes",
  MODELS = "lib/models",
  LIB = "lib"
}
