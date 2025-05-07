import { StoreConfig } from "../models/config";
import { QuickBuildConfig } from "../models/quickBuild";



/**
 * Converts standard StoreConfig to QuickBuildConfig format
 *
 * @param storeConfig - The full store configuration
 * @returns QuickBuildConfig - Simplified quick build configuration
 */
export function convertToQuickBuildConfig(
  storeConfig: StoreConfig
): QuickBuildConfig {
  // Find icon URLs from assets
  const lightIconAsset = storeConfig.assets?.images.find((img) =>
    img.name.toLowerCase().includes("light")
  );
  const darkIconAsset = storeConfig.assets?.images.find((img) =>
    img.name.toLowerCase().includes("dark")
  );

  const lightIconUrl = lightIconAsset?.url || "";
  const darkIconUrl = darkIconAsset?.url || "";

  // Determine template type with fallback
  const templateType = (storeConfig.metadata.templateType || "fashion") as
    | "fashion"
    | "electronic"
    | "shoes";

  // Convert radius to allowed values (0, 5, 10, 15, 100)
  const radius = getNearestAllowedRadius(storeConfig.design.radius);

  return {
    baseUrl: storeConfig.metadata.baseUrl,
    buildType: "quick_build",
    storeId: storeConfig.metadata.storeId,
    appName: storeConfig.metadata.storeName,
    appDescription: storeConfig.metadata.description,
    appSlogan: storeConfig.metadata.storeSlogan || "",
    type: templateType,
    radius,
    lightColors: storeConfig.design.lightTheme,
    darkColors: storeConfig.design.darkTheme,
    lightIconUrl,
    darkIconUrl,
    splashScreen: {
      lightBackgroundColor: storeConfig.splashScreen.lightBackgroundColor,
      darkBackgroundColor: storeConfig.splashScreen.darkBackgroundColor,
    },
  };
}

/**
 * Maps any radius value to the nearest allowed value (0, 5, 10, 15, 100)
 *
 * @param radius - The original radius value
 * @returns The nearest allowed radius value
 */
function getNearestAllowedRadius(radius: number): 0 | 5 | 10 | 15 | 100 {
  const allowedValues = [0, 5, 10, 15, 100];

  // Find the closest allowed value
  let closestValue = allowedValues[0];
  let smallestDifference = Math.abs(radius - closestValue);

  for (const value of allowedValues) {
    const difference = Math.abs(radius - value);
    if (difference < smallestDifference) {
      smallestDifference = difference;
      closestValue = value;
    }
  }

  return closestValue as 0 | 5 | 10 | 15 | 100;
}

/**
 * Converts QuickBuildConfig back to standard StoreConfig format
 *
 * @param quickConfig - The simplified quick build configuration
 * @returns StoreConfig - Full store configuration
 */
export function convertToStoreConfig(
  quickConfig: QuickBuildConfig
): StoreConfig {
  return {
    metadata: {
      baseUrl: "",
      storeId: quickConfig.storeId,
      storeName: quickConfig.appName,
      description: quickConfig.appDescription,
      storeSlogan: quickConfig.appSlogan,
      templateType: quickConfig.type,
    },
    app: {
      name: quickConfig.appName,
      bundleId: `com.${quickConfig.appName.replace(/\s+/g, "_")}.app`,
      version: {
        name: "1.0.0",
        code: 1,
      },
      supportedLocales: ["en"],
    },
    design: {
      radius: quickConfig.radius,
      lightTheme: quickConfig.lightColors,
      darkTheme: quickConfig.darkColors,
    },
    splashScreen: {
      lightBackgroundColor: quickConfig.splashScreen.lightBackgroundColor,
      darkBackgroundColor: quickConfig.splashScreen.darkBackgroundColor,
    },
    assets: {
      images: [
        {
          name: "light icon",
          url: quickConfig.lightIconUrl,
          path: "assets/icons/splash_light.png",
        },
        {
          name: "dark icon",
          url: quickConfig.darkIconUrl,
          path: "assets/icons/splash_dark.png",
        },
      ],
    },
    // Since QuickBuildConfig doesn't contain project structure information,
    // we need to add a placeholder that will be filled in later
    projectStructure: {
      entry: { name: "main.dart", path: "lib/main.dart" },
      core: [],
      services: [],
      theme: [],
      utils: [],
      dependency_injection: [],
      shared_controllers: [],
      shared_widgets: [],
      button_components: [],
      controllers: [],
      models: [],
      repositories: [],
      bindings: [],
      screens: [],
      widgets: [],
      project_config: [],
    },
  };
}
