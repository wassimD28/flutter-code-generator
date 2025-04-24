import { ThemeDesign } from "./theme";

export interface StoreConfig {
  metadata: {
    storeId: string;
    storeName: string;
    description: string;
    apiEndpoint: string;
    callbackUrl?: string;
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
    theme: ThemeDesign;
  };
  features: {
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
    entry: {
      name: string;
      path: string;
    };
  };
  assets: {
    images: Array<{ name: string; url: string; path: string }>;
    fonts: Array<{ name: string; path: string }>;
  };
}

// The processed config can remain mostly the same, but adapt it to derive
// values from the new structure
export interface ProcessedConfig extends StoreConfig {
  appName: string; // Derived from metadata.storeName
  welcomeMessage: string;
}
