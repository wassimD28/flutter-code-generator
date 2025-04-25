/**
 * Flutter Template Structure Generator
 * This script scans template files and updates the projectStructure section in config.json
 */

import * as fs from "fs";
import * as path from "path";

// Type definitions for better type safety
interface FileItem {
  name: string;
  path: string;
}

interface ProjectStructure {
  core: FileItem[];
  services: FileItem[];
  theme: FileItem[];
  utils: FileItem[];
  dependency_injection: FileItem[];
  shared_controllers: FileItem[];
  shared_widgets: FileItem[];
  button_components: FileItem[];
  controllers: FileItem[];
  models: FileItem[];
  repositories: FileItem[];
  bindings: FileItem[];
  screens: FileItem[];
  widgets: FileItem[];
  project_config: FileItem[];
  entry: FileItem; // This is a single item, not an array
}

interface Config {
  projectStructure: ProjectStructure;
  [key: string]: any; // Allow for other properties in the config
}

// Command line arguments interface
interface ScriptOptions {
  configPath: string;
  templateFolderPath: string;
  debug: boolean;
  verboseLog: boolean;
}

// Special cases dictionary for acronyms and technical terms
const specialCases: Record<string, string> = {
  di: "Dependency Injection",
  api: "API",
  api_client: "API Client",
  ui: "UI",
  ui_config: "UI Configuration",
  http: "HTTP",
  json: "JSON",
  xml: "XML",
  url: "URL",
  uri: "URI",
  sdk: "SDK",
  jwt: "JWT",
  oauth: "OAuth",
  rsa: "RSA",
  ssl: "SSL",
  tls: "TLS",
  db: "Database",
  app_notification_type: "App Notification Type",
  app_config: "App Configuration",
  app_typography: "App Typography",
  main_routes: "Main Routes",
  custom_app_bar: "Custom App Bar",
  alert_exit_app: "Alert Exit App",
};

// Files to specifically check for
const specificFilesToCheck = [
  "lib/app/core/config/app_notification_type.dart.hbs",
  "lib/app/core/config/app_config.dart.hbs",
  "lib/app/core/theme/app_typography.dart.hbs",
  "lib/features/home/views/widgets/custom_app_bar.dart.hbs",
  "lib/app/core/config/main_routes.dart.hbs",
  "lib/app/core/utils/alert_exit_app.dart",
];

// Specific file paths with their expected categories
const specificPathsWithCategories: {
  path: string;
  expectedCategory: keyof Omit<ProjectStructure, "entry"> | "entry";
}[] = [
  {
    path: "lib/app/core/config/app_notification_type.dart",
    expectedCategory: "core",
  },
  { path: "lib/app/core/config/app_config.dart", expectedCategory: "core" },
  { path: "lib/app/core/theme/app_typography.dart", expectedCategory: "theme" },
  {
    path: "lib/features/home/views/widgets/custom_app_bar.dart",
    expectedCategory: "widgets",
  },
  { path: "lib/app/core/config/main_routes.dart", expectedCategory: "core" },
  { path: "lib/app/core/utils/alert_exit_app.dart", expectedCategory: "utils" },
];

/**
 * Function to log debug information
 */
function writeDebugLog(message: string, options: ScriptOptions): void {
  if (options.debug) {
    console.log(`DEBUG: ${message}`);
  }
}

/**
 * Function for more verbose logging (showing all files being processed)
 */
function writeVerboseLog(message: string, options: ScriptOptions): void {
  if (options.verboseLog) {
    console.log(`VERBOSE: ${message}`);
  }
}

/**
 * Improved function to convert file names to proper Title Case
 */
function getPrettyName(name: string): string {
  // First check if the entire name is a special case
  if (specialCases[name.toLowerCase()]) {
    return specialCases[name.toLowerCase()];
  }

  // Normalize the name: first replace camelCase with snake_case
  let normalizedName = "";
  for (let i = 0; i < name.length; i++) {
    const char = name[i];
    // If this is an uppercase letter and not the first character
    // and the previous character is not an uppercase letter or underscore
    if (
      /[A-Z]/.test(char) &&
      i > 0 &&
      !(/[A-Z]/.test(name[i - 1]) || name[i - 1] === "_")
    ) {
      normalizedName += "_" + char;
    } else {
      normalizedName += char;
    }
  }

  // Convert to lowercase for consistent processing
  normalizedName = normalizedName.toLowerCase();

  // Split by underscores
  const words = normalizedName.split("_");

  const result: string[] = [];
  for (const word of words) {
    if (specialCases[word]) {
      result.push(specialCases[word]);
    } else {
      // Handle general case - capitalize first letter
      if (word.length > 0) {
        result.push(word.charAt(0).toUpperCase() + word.slice(1));
      }
    }
  }

  return result.join(" ");
}

/**
 * Extract the meaningful component from the path for better naming
 */
function getComponentNameFromPath(filePath: string): string {
  // First normalize path separators
  const normalizedPath = filePath.replace(/\\/g, "/");

  // Get the file name without extension
  const fileName = path.basename(normalizedPath, path.extname(normalizedPath));

  // Extract feature name from path
  let featureName = "";
  const featureMatch = normalizedPath.match(/features\/([^/]+)/);
  if (featureMatch) {
    featureName = featureMatch[1];
    // Normalize feature name (handle camelCase in folder names)
    featureName = getPrettyName(featureName);
  }

  // Get the pretty version of the file name
  const prettyFileName = getPrettyName(fileName);

  // If the feature name is already part of the file name, don't repeat it
  if (prettyFileName.includes(featureName)) {
    return prettyFileName;
  }

  // Otherwise, combine them
  if (featureName) {
    return `${featureName} ${prettyFileName}`;
  }

  return prettyFileName;
}

/**
 * Function to extract file name without extension
 */
function getSafeFileName(name: string): string {
  try {
    // Try the standard method first
    return path.basename(name, path.extname(name));
  } catch (error) {
    console.error(`Error extracting filename from '${name}': ${error}`);
    // Fallback to regex-based extraction
    let cleanName = name.replace(
      /\.hbs$|\.dart$|\.yaml$|\.json$|\.txt$|\.md$/,
      ""
    );
    // Remove any remaining file extensions
    cleanName = cleanName.replace(/\.[^.]+$/, "");
    // Replace illegal characters
    cleanName = cleanName.replace(/[\\/:*?"<>|]/g, "_");
    console.log(`Cleaned filename: '${cleanName}'`);
    return cleanName;
  }
}

/**
 * Enhanced function to categorize a file based on its name and path
 */
function getFileCategory(
  fileName: string,
  filePath: string
): keyof ProjectStructure {
  const lowerFileName = fileName.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  // Check for specific files
  const specificFiles: Record<string, keyof ProjectStructure> = {
    app_notification_type: "core",
    app_config: "core",
    app_typography: "theme",
    custom_app_bar: "widgets",
    main_routes: "core",
    alert_exit_app: "utils",
  };

  // First check for exact matches of specific files
  for (const key in specificFiles) {
    if (lowerFileName === key) {
      return specificFiles[key];
    }
  }

  // Check for config files first - they should be categorized as core
  if (lowerPath.includes("/config/") || lowerFileName.includes("config")) {
    return "core";
  }

  // Then check for specific patterns in the file name
  if (lowerFileName === "main" && /^lib\/main\.dart$/.test(lowerPath)) {
    return "entry"; // Only exact match for lib/main.dart should be entry
  } else if (
    lowerFileName.includes("screen") ||
    lowerFileName.includes("page") ||
    lowerFileName.includes("view")
  ) {
    return "screens";
  } else if (
    lowerFileName.includes("widget") ||
    lowerFileName.includes("component") ||
    lowerFileName.includes("app_bar")
  ) {
    // Decide between shared_widgets and widgets
    if (lowerPath.includes("/shared/") || lowerPath.includes("/common/")) {
      return "shared_widgets";
    }
    return "widgets";
  } else if (lowerFileName.includes("button")) {
    return "button_components";
  } else if (lowerFileName.includes("controller")) {
    // Decide between shared_controllers and controllers
    if (lowerPath.includes("/shared/") || lowerPath.includes("/common/")) {
      return "shared_controllers";
    }
    return "controllers";
  } else if (
    lowerFileName.includes("model") ||
    lowerFileName.includes("dto") ||
    lowerFileName.includes("entity")
  ) {
    return "models";
  } else if (
    lowerFileName.includes("repository") ||
    lowerFileName.includes("repo")
  ) {
    return "repositories";
  } else if (
    lowerFileName.includes("service") ||
    lowerFileName.includes("provider")
  ) {
    return "services";
  } else if (
    lowerFileName.includes("binding") ||
    lowerFileName.includes("binder")
  ) {
    return "bindings";
  } else if (
    lowerFileName.includes("theme") ||
    lowerFileName.includes("style") ||
    lowerFileName.includes("color") ||
    lowerFileName.includes("typography")
  ) {
    return "theme";
  } else if (
    lowerFileName.includes("util") ||
    lowerFileName.includes("helper") ||
    lowerFileName.includes("formatter") ||
    lowerFileName.includes("extension")
  ) {
    return "utils";
  } else if (
    lowerFileName.includes("di") ||
    lowerFileName.includes("injection") ||
    lowerFileName.includes("locator")
  ) {
    return "dependency_injection";
  } else if (lowerFileName.includes("main") || lowerFileName.includes("app")) {
    return "entry";
  } else if (
    lowerFileName.includes("config") ||
    lowerFileName.includes("pubspec") ||
    lowerFileName.includes("manifest")
  ) {
    return "project_config";
  }

  // Then check paths (lower priority)
  if (
    lowerPath.includes("/screen/") ||
    lowerPath.includes("/page/") ||
    lowerPath.includes("/views/")
  ) {
    return "screens";
  } else if (
    lowerPath.includes("/widget/") ||
    lowerPath.includes("/component/")
  ) {
    if (lowerPath.includes("/shared/") || lowerPath.includes("/common/")) {
      return "shared_widgets";
    }
    return "widgets";
  } else if (lowerPath.includes("/button")) {
    return "button_components";
  } else if (lowerPath.includes("/controller/")) {
    if (lowerPath.includes("/shared/") || lowerPath.includes("/common/")) {
      return "shared_controllers";
    }
    return "controllers";
  } else if (lowerPath.includes("/model/") || lowerPath.includes("/dto/")) {
    return "models";
  } else if (
    lowerPath.includes("/repository/") ||
    lowerPath.includes("/repo/")
  ) {
    return "repositories";
  } else if (
    lowerPath.includes("/service/") ||
    lowerPath.includes("/provider/")
  ) {
    return "services";
  } else if (lowerPath.includes("/binding/")) {
    return "bindings";
  } else if (lowerPath.includes("/theme/") || lowerPath.includes("/style/")) {
    return "theme";
  } else if (lowerPath.includes("/util/") || lowerPath.includes("/helper/")) {
    return "utils";
  } else if (lowerPath.includes("/di/") || lowerPath.includes("/injection/")) {
    return "dependency_injection";
  } else if (lowerPath.includes("/core/")) {
    return "core";
  }

  // Default category
  return "core";
}

/**
 * Function to normalize path separators
 */
function getNormalizedPath(filePath: string): string {
  // Replace backslashes with forward slashes for consistency
  return filePath.replace(/\\/g, "/");
}

/**
 * Function to check for specific missing files
 */
function testSpecificFiles(templatePath: string, filesList: string[]): void {
  console.log("Checking for specific files:");

  for (const fileToCheck of specificFilesToCheck) {
    const fullPath = path.join(templatePath, fileToCheck);

    if (fs.existsSync(fullPath)) {
      console.log(`  - File exists: ${fileToCheck}`);

      // Check if it's in the processed list
      let found = false;
      for (const file of filesList) {
        const relativePath = file.substring(templatePath.length + 1);
        const normalizedPath = getNormalizedPath(relativePath);

        if (normalizedPath === fileToCheck) {
          found = true;
          console.log(`    - File is in processing list`);
          break;
        }
      }

      if (!found) {
        console.log(
          `    - WARNING: File exists but is NOT in processing list!`
        );
      }
    } else {
      console.log(`  - File NOT found: ${fileToCheck}`);
    }
  }
}

/**
 * Function to scan template files
 */
function getTemplateFiles(
  templateFolderPath: string,
  options: ScriptOptions
): ProjectStructure {
  // Check if template folder exists
  if (!fs.existsSync(templateFolderPath)) {
    throw new Error(`Template folder not found at path: ${templateFolderPath}`);
  }

  console.log(`Scanning template files in: ${templateFolderPath}`);

  // Get all files recursively
  const files: string[] = [];
  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  scanDir(templateFolderPath);

  // Check for specific files we want to ensure are processed
  testSpecificFiles(templateFolderPath, files);

  // Create structure exactly as specified
  const projectStructure: ProjectStructure = {
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
    entry: {
      // Initialize with correct values directly
      name: "Main",
      path: "lib/main.dart",
    },
  };

  const totalFiles = files.length;
  let processedCount = 0;
  const missingFiles = [
    "lib/app/core/config/app_notification_type.dart",
    "lib/app/core/config/app_config.dart",
    "lib/app/core/theme/app_typography.dart",
    "lib/features/home/views/widgets/custom_app_bar.dart",
    "lib/app/core/config/main_routes.dart",
    "lib/app/core/utils/alert_exit_app.dart",
  ];

  // Track found files from the missing list
  const foundMissingFiles: Record<string, boolean> = {};
  for (const file of missingFiles) {
    foundMissingFiles[file] = false;
  }

  console.log(`Found ${totalFiles} files to process`);

  // Track processed paths to verify everything is included
  const processedPaths: Record<string, boolean> = {};

  for (const file of files) {
    processedCount++;

    // Show progress every 10 files
    if (processedCount % 10 === 0 || processedCount === totalFiles) {
      console.log(
        `Processed ${processedCount} of ${totalFiles} files (${
          (processedCount * 100) / totalFiles
        }%)`
      );
    }

    // Get the relative path from the template folder
    const relativePath = file.substring(templateFolderPath.length + 1);

    // Normalize path separators for consistency
    const normalizedPath = getNormalizedPath(relativePath);

    // Check if this is one of our missing files
    const pathWithoutHbs = normalizedPath.replace(/\.hbs$/, "");
    for (const missingFile of missingFiles) {
      if (pathWithoutHbs === missingFile) {
        console.log(`Found missing file: ${missingFile}`);
        foundMissingFiles[missingFile] = true;
      }
    }

    // Track processed paths
    processedPaths[normalizedPath] = true;

    // Remove .hbs extension if present
    const cleanPath = normalizedPath.replace(/\.hbs$/, "");

    // Generate better name using both the feature name and component type
    const prettyName = getComponentNameFromPath(cleanPath);

    // Create item with pretty name
    const item: FileItem = {
      name: prettyName,
      path: cleanPath,
    };

    writeVerboseLog(
      `Processing file: ${path.basename(file)} -> ${item.name} at ${cleanPath}`,
      options
    );

    // Get file name without extension for categorization
    const fileName = getSafeFileName(path.basename(file));

    // Categorize the file
    const category = getFileCategory(fileName, cleanPath);

    // Add to appropriate category BUT protect entry from being overwritten
    if (category === "entry" && cleanPath === "lib/main.dart") {
      // Set the entry explicitly
      projectStructure.entry = {
        name: "Main",
        path: "lib/main.dart",
      };
      writeDebugLog(`Set main entry file: ${item.path}`, options);
    } else if (category === "entry") {
      // Skip other "entry" categorized files
      writeDebugLog(
        `Found another entry-like file but using default entry configuration: ${item.path}`,
        options
      );
    } else {
      // Add to the appropriate category array
      (projectStructure[category] as FileItem[]).push(item);
      writeDebugLog(
        `Added file to category ${category}: ${item.path}`,
        options
      );

      // Double check if this is actually the main.dart file
      if (cleanPath === "lib/main.dart") {
        // Set the entry explicitly
        projectStructure.entry = {
          name: "Main",
          path: "lib/main.dart",
        };
        writeDebugLog(`Set main entry file: ${item.path}`, options);
      }
    }
  }

  // Check and report any missing files that were not found
  let stillMissing = false;
  for (const key in foundMissingFiles) {
    if (!foundMissingFiles[key]) {
      console.log(`WARNING: Still missing file: ${key}`);
      stillMissing = true;
    }
  }

  if (!stillMissing) {
    console.log("All previously missing files were found and processed!");
  }

  // Print category summary
  console.log("Categorization summary:");
  for (const category of Object.keys(projectStructure) as Array<
    keyof ProjectStructure
  >) {
    if (category === "entry") {
      console.log(`- Entry: ${projectStructure.entry ? "1" : "0"} file`);
    } else {
      console.log(
        `- ${category
          .replace(/_/g, " ")
          .replace(/\b\w/g, (l) => l.toUpperCase())}: ${
          (projectStructure[category] as FileItem[]).length
        } files`
      );
    }
  }

  // Verify all specific files are categorized
  console.log("Verifying specific files categorization:");

  for (const specificPath of specificPathsWithCategories) {
    const path = specificPath.path;
    const expectedCategory = specificPath.expectedCategory;
    let found = false;

    if (expectedCategory === "entry") {
      if (projectStructure.entry.path === path) {
        console.log(`  - Found correctly categorized: ${path} in entry`);
        found = true;
      }
    } else {
      for (const item of projectStructure[expectedCategory]) {
        if (item.path === path) {
          console.log(
            `  - Found correctly categorized: ${path} in ${expectedCategory}`
          );
          found = true;
          break;
        }
      }
    }

    if (!found) {
      console.log(
        `  - NOT found in expected category: ${path} in ${expectedCategory}`
      );

      // Search other categories
      for (const category of Object.keys(projectStructure) as Array<
        keyof ProjectStructure
      >) {
        if (category === "entry") {
          if (projectStructure.entry.path === path) {
            console.log(`    - Found instead in: entry`);
          }
          continue;
        }

        for (const item of projectStructure[category] as FileItem[]) {
          if (item.path === path) {
            console.log(`    - Found instead in: ${category}`);
          }
        }
      }
    }
  }

  // Add missing specific files if needed
  for (const specificPath of specificPathsWithCategories) {
    const filePath = specificPath.path;
    const expectedCategory = specificPath.expectedCategory;
    let found = false;

    if (expectedCategory === "entry") {
      if (projectStructure.entry.path === filePath) {
        found = true;
      }
    } else {
      for (const item of projectStructure[expectedCategory] as FileItem[]) {
        if (item.path === filePath) {
          found = true;
          break;
        }
      }
    }

    if (!found) {
      console.log(
        `Adding missing specific file: ${filePath} to ${expectedCategory}`
      );
      const fileName = path.basename(filePath, path.extname(filePath));
      const prettyName = getPrettyName(fileName);

      const newItem: FileItem = {
        name: prettyName,
        path: filePath,
      };

      if (expectedCategory === "entry") {
        projectStructure.entry = newItem;
      } else {
        (projectStructure[expectedCategory] as FileItem[]).push(newItem);
      }
    }
  }

  // This ensures entry has correct values even if something went wrong
  projectStructure.entry = {
    name: "Main",
    path: "lib/main.dart",
  };
  writeDebugLog(
    "Final validation: Setting entry to Main at lib/main.dart",
    options
  );

  return projectStructure;
}

/**
 * Main function to run the script
 */
function main() {
  // Default options
  const options: ScriptOptions = {
    configPath: process.env.CONFIG_PATH || "config.json",
    templateFolderPath: process.env.TEMPLATE_FOLDER_PATH || "src/templates",
    debug: process.env.DEBUG === "true",
    verboseLog: process.env.VERBOSE_LOG === "true",
  };

  // Process command line arguments
  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    if (arg === "--debug") {
      options.debug = true;
    } else if (arg === "--verbose") {
      options.verboseLog = true;
    } else if (arg.startsWith("--config=")) {
      options.configPath = arg.split("=")[1];
    } else if (arg.startsWith("--templates=")) {
      options.templateFolderPath = arg.split("=")[1];
    }
  }

  try {
    console.log("Starting template scanner...");

    // Check if config file exists
    const configExists = fs.existsSync(options.configPath);
    let originalConfig: Config = {
      projectStructure: {} as ProjectStructure,
    };

    if (configExists) {
      // Read existing config
      try {
        const originalConfigText = fs.readFileSync(options.configPath, "utf8");
        originalConfig = JSON.parse(originalConfigText);
        console.log(`Reading existing config file: ${options.configPath}`);
      } catch (error) {
        console.log(
          `Error parsing existing config JSON, will create new: ${error}`
        );
      }
    } else {
      console.log(
        `Config file does not exist. Will create a new one: ${options.configPath}`
      );
    }

    // Scan template files
    console.log(`Scanning template files in ${options.templateFolderPath}...`);
    const projectStructure = getTemplateFiles(
      options.templateFolderPath,
      options
    );
    console.log("Template scan completed successfully");

    // Update the project structure in the config
    originalConfig.projectStructure = projectStructure;

    // Convert to JSON and save back
    console.log(`Writing updated config to ${options.configPath}...`);
    fs.writeFileSync(
      options.configPath,
      JSON.stringify(originalConfig, null, 2)
    );

    console.log(
      "Done! Template structure has been successfully updated in config.json"
    );
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    if (error instanceof Error) {
      console.error(`Stack trace: ${error.stack}`);
    }
    process.exit(1);
  }
}

// Execute the main function
main();
