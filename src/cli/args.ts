import fs from "fs";
import path from "path";
import { StoreConfig } from "../models/config";

interface CLIArgs {
  config: string;
  outputDir: string;
}

export function parseArgs(): { config: StoreConfig; outputDir: string } {
  // Use node's process.argv to parse command-line arguments
  const args = process.argv;

  // Look for --config and --output flags anywhere in the arguments
  let configPath: string | undefined;
  let outputDir: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--config" && i + 1 < args.length) {
      configPath = args[i + 1];
    }
    if (args[i] === "--output" && i + 1 < args.length) {
      outputDir = args[i + 1];
    }
  }

  // If the flags aren't found, check if the arguments are directly provided
  // This supports both forms:
  // - npm run dev -- --config config.json --output generated-app
  // - npm run dev config.json generated-app
  if (!configPath && args.length > 2) {
    // Assume the first argument after the script is the config path
    configPath = args[2];
  }

  if (!outputDir && args.length > 3) {
    // Assume the second argument after the script is the output directory
    outputDir = args[3];
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
    const config: StoreConfig = JSON.parse(rawConfig);

    return {
      config,
      outputDir: path.resolve(process.cwd(), outputDir),
    };
  } catch (error) {
    throw new Error(
      `Failed to parse configuration: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
