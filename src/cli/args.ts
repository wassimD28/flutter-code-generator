import fs from "fs";
import path from "path";
import { StoreConfig } from "../models/config";


export function parseArgs(): {
  config: StoreConfig;
  outputDir: string;
  templateDir?: string;
  projectStructureFile?: string;
} {
  // Use node's process.argv to parse command-line arguments
  const args = process.argv;

  // Look for --config, --output, --template, and --structure flags anywhere in the arguments
  let configPath: string | undefined;
  let outputDir: string | undefined;
  let templateDir: string | undefined;
  let structureFile: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" && i + 1 < args.length) {
      configPath = args[i + 1];
    }
    if (args[i] === "--output" && i + 1 < args.length) {
      outputDir = args[i + 1];
    }
    if (args[i] === "--template" && i + 1 < args.length) {
      templateDir = args[i + 1];
    }
    if (args[i] === "--structure" && i + 1 < args.length) {
      structureFile = args[i + 1];
    }
  }

  // If the flags aren't found, check for positional arguments
  if (!configPath && args.length > 2) {
    configPath = args[2];
  }
  if (!outputDir && args.length > 3) {
    outputDir = args[3];
  }
  if (!templateDir && args.length > 4) {
    templateDir = args[4];
  }
  if (!structureFile && args.length > 5) {
    structureFile = args[5];
  }

  if (!configPath) {
    throw new Error(
      "Config file not specified. Use --config flag or provide as first argument."
    );
  }

  if (!outputDir) {
    throw new Error(
      "Output directory not specified. Use --output flag or provide as second argument."
    );
  }

  try {
    // Resolve absolute path for the config file
    const resolvedConfigPath = path.resolve(process.cwd(), configPath);

    // Check if the config file exists
    if (!fs.existsSync(resolvedConfigPath)) {
      throw new Error(`Config file not found: ${resolvedConfigPath}`);
    }

    // Read and parse the configuration file
    const rawConfig = fs.readFileSync(resolvedConfigPath, "utf-8");
    let config: StoreConfig = JSON.parse(rawConfig);

    // If a project structure file is specified, merge it with the config
    if (structureFile) {
      const structurePath = path.resolve(process.cwd(), structureFile);
      if (!fs.existsSync(structurePath)) {
        throw new Error(`Project structure file not found: ${structurePath}`);
      }

      const structureContent = fs.readFileSync(structurePath, "utf-8");
      const projectStructure = JSON.parse(structureContent);

      // Log the project structure to debug
      console.log(
        "[DEBUG] Project structure loaded:",
        JSON.stringify({
          hasEntry: !!projectStructure.entry,
          entryPath: projectStructure.entry?.path,
          sections: Object.keys(projectStructure),
        })
      );

      // Merge the project structure into the config
      config = {
        ...config,
        projectStructure,
      };

      // Verify the merged config has the expected structure
      console.log(
        "[DEBUG] Merged config structure:",
        JSON.stringify({
          hasProjectStructure: !!config.projectStructure,
          hasEntryInStructure: !!config.projectStructure?.entry,
          entryPath: config.projectStructure?.entry?.path,
        })
      );
    }

    return {
      config,
      outputDir: path.resolve(process.cwd(), outputDir),
      templateDir: templateDir
        ? path.resolve(process.cwd(), templateDir)
        : undefined,
      projectStructureFile: structureFile,
    };
  } catch (error) {
    throw new Error(
      `Failed to parse configuration: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}