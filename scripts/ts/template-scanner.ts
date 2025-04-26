import * as fs from "fs";
import * as path from "path";

// Add command line argument parsing
import * as process from "process";

// Simplified type definitions
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
  entry: FileItem;
}

interface Config {
  projectStructure: ProjectStructure;
  [key: string]: any;
}

// Simplified special cases for technical terms
const specialCases: Record<string, string> = {
  di: "Dependency Injection",
  api: "API",
  ui: "UI",
  http: "HTTP",
  json: "JSON",
  sdk: "SDK",
  db: "Database",
};

// List of files that should always be in project_config
const projectConfigFiles = [
  "info.plist",
  "build.gradle.kts",
  "androidmanifest.xml",
  "pubspec.yaml",
  "gradle.properties",
  "settings.gradle",
  "proguard-rules.pro",
  "google-services.json",
  "firebase_options.dart",
];

/**
 * Converts file names to Title Case with special case handling
 */
function getPrettyName(name: string): string {
  // Check if entire name is a special case
  if (specialCases[name.toLowerCase()]) {
    return specialCases[name.toLowerCase()];
  }

  // Convert camelCase or snake_case to spaces
  const normalized = name
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .toLowerCase();

  // Handle special cases and capitalize words
  return normalized
    .split(" ")
    .map(
      (word) =>
        specialCases[word] || word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(" ");
}

/**
 * Extract meaningful component name from the path
 */
function getComponentNameFromPath(filePath: string): string {
  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, "/");

  // Get the file name without extension
  const fileName = path.basename(normalizedPath, path.extname(normalizedPath));

  // Extract feature name if it exists
  const featureMatch = normalizedPath.match(/features\/([^/]+)/);
  let featureName = featureMatch ? getPrettyName(featureMatch[1]) : "";

  const prettyFileName = getPrettyName(fileName);

  if (!featureName || prettyFileName.includes(featureName)) {
    return prettyFileName;
  }

  return `${featureName} ${prettyFileName}`;
}

/**
 * Categorize a file based on name and path
 */
function getFileCategory(
  fileName: string,
  filePath: string
): keyof ProjectStructure {
  const lowerFileName = fileName.toLowerCase();
  const lowerPath = filePath.toLowerCase();

  // Check for specific project config files first
  if (
    projectConfigFiles.some((configFile) => lowerFileName.includes(configFile))
  ) {
    return "project_config";
  }

  // Main entry file check
  if (lowerFileName === "main" && /^lib\/main\.dart$/.test(lowerPath)) {
    return "entry";
  }

  // Check path-based categories
  if (lowerPath.includes("/config/") || lowerFileName.includes("config")) {
    return "core";
  } else if (
    lowerPath.includes("/screen/") ||
    lowerPath.includes("/view/") ||
    lowerFileName.includes("screen") ||
    lowerFileName.includes("page")
  ) {
    return "screens";
  } else if (
    lowerPath.includes("/widget/") ||
    lowerFileName.includes("widget")
  ) {
    return lowerPath.includes("/shared/") ? "shared_widgets" : "widgets";
  } else if (
    lowerPath.includes("/button") ||
    lowerFileName.includes("button")
  ) {
    return "button_components";
  } else if (
    lowerPath.includes("/controller/") ||
    lowerFileName.includes("controller")
  ) {
    return lowerPath.includes("/shared/")
      ? "shared_controllers"
      : "controllers";
  } else if (lowerPath.includes("/model/") || lowerFileName.includes("model")) {
    return "models";
  } else if (
    lowerPath.includes("/repository/") ||
    lowerFileName.includes("repository")
  ) {
    return "repositories";
  } else if (
    lowerPath.includes("/service/") ||
    lowerFileName.includes("service")
  ) {
    return "services";
  } else if (
    lowerPath.includes("/binding/") ||
    lowerFileName.includes("binding")
  ) {
    return "bindings";
  } else if (lowerPath.includes("/theme/") || lowerFileName.includes("theme")) {
    return "theme";
  } else if (lowerPath.includes("/util/") || lowerFileName.includes("util")) {
    return "utils";
  } else if (lowerPath.includes("/di/") || lowerFileName.includes("di")) {
    return "dependency_injection";
  } else if (lowerPath.includes("/core/")) {
    return "core";
  }

  // Default category
  return "core";
}

/**
 * Function to scan template files
 */
function getTemplateFiles(
  templateFolderPath: string,
  templateName: string
): ProjectStructure {
  if (!fs.existsSync(templateFolderPath)) {
    throw new Error(`Template folder not found at path: ${templateFolderPath}`);
  }

  console.log(`Scanning template files in: ${templateFolderPath}`);
  console.log(`Template name to remove from paths: ${templateName}`);

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

  console.log(`Found ${files.length} files to process`);

  // Initialize project structure
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
    entry: { name: "Main", path: "lib/main.dart" },
  };

  // Process each file
  for (const file of files) {
    // Get the relative path from the template folder
    const relativePath = file
      .substring(templateFolderPath.length + 1)
      .replace(/\\/g, "/");

    // Remove .hbs extension if present
    let cleanPath = relativePath.replace(/\.hbs$/, "");

    // Remove the template name from the beginning of the path if it exists
    // This handles cases like "fashion/android/..." -> "android/..."
    if (templateName && cleanPath.startsWith(`${templateName}/`)) {
      cleanPath = cleanPath.substring(templateName.length + 1);
      console.log(
        `Removed template name from path: ${relativePath} -> ${cleanPath}`);
    }

    // Generate better name
    const prettyName = getComponentNameFromPath(cleanPath);

    // Create file item
    const item: FileItem = {
      name: prettyName,
      path: cleanPath,
    };

    // Get category
    const fileName = path.basename(file, path.extname(file));
    const category = getFileCategory(fileName, cleanPath);

    // Add to appropriate category
    if (category === "entry" && cleanPath === "lib/main.dart") {
      projectStructure.entry = item;
    } else if (category !== "entry") {
      (projectStructure[category] as FileItem[]).push(item);
    }
  }

  // Print category summary
  console.log("Categorization summary:");
  for (const category of Object.keys(projectStructure) as Array<
    keyof ProjectStructure
  >) {
    if (category === "entry") {
      console.log(`- Entry: 1 file`);
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

  return projectStructure;
}

/**
 * Parse command line arguments
 */
function parseArgs(): { input: string; output: string; template: string } {
  // Define the default values
  const defaults = {
    input: "src/templates",
    output: "config.json",
    template: "",
  };

  // Create an argument parser
  const args = process.argv.slice(2);
  const parsedArgs: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--input" || arg === "-i") {
      parsedArgs.input = args[++i];
    } else if (arg === "--output" || arg === "-o") {
      parsedArgs.output = args[++i];
    } else if (arg === "--template" || arg === "-t") {
      parsedArgs.template = args[++i];
    } else if (arg === "--help" || arg === "-h") {
      console.log(`
Template Scanner - Analyzes project template structures

Usage:
  node template-scanner.js [options]

Options:
  -i, --input <path>     Input templates folder path (default: ${defaults.input})
  -o, --output <path>    Output config file path (default: ${defaults.output})
  -t, --template <name>  Template name to scan (default: scan all templates)
  -h, --help             Show this help message
      `);
      process.exit(0);
    }
  }

  // Use provided args or defaults
  return {
    input:
      parsedArgs.input || process.env.TEMPLATE_FOLDER_PATH || defaults.input,
    output: parsedArgs.output || process.env.CONFIG_PATH || defaults.output,
    template:
      parsedArgs.template || process.env.TEMPLATE_NAME || defaults.template,
  };
}

/**
 * Main function
 */
function main() {
  try {
    console.log("Starting template scanner...");

    // Parse command line arguments
    const {
      input: templatesBasePath,
      output: configPath,
      template: templateName,
    } = parseArgs();

    // Determine the actual path to scan based on template name
    let templateFolderPath = templatesBasePath;
    if (templateName) {
      templateFolderPath = path.join(templatesBasePath, templateName);
      console.log(`Scanning specific template: ${templateName}`);
    }

    console.log(`Using template folder: ${templateFolderPath}`);
    console.log(`Using output config file: ${configPath}`);

    // Read or initialize config
    let config: Config = { projectStructure: {} as ProjectStructure };
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, "utf8"));
        console.log(`Reading existing config file: ${configPath}`);
      } catch (error) {
        console.log(`Error parsing config JSON, will create new: ${error}`);
      }
    }

    // Scan template files
    const projectStructure = getTemplateFiles(templateFolderPath, templateName);

    // Update config
    config.projectStructure = projectStructure;

    // Create directory for output config file if it doesn't exist
    const outputDir = path.dirname(configPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created output directory: ${outputDir}`);
    }

    // Save config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    console.log(
      `Template structure has been successfully saved to ${configPath}`
    );
  } catch (error) {
    console.error(`An error occurred: ${error}`);
    process.exit(1);
  }
}

// Execute the main function
main();
