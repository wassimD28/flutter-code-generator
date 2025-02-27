import { StoreConfig } from "../models/config";

interface ParsedArgs {
  config: StoreConfig;
  outputDir: string;
}

export function parseArgs(): ParsedArgs {
  // Default values
  let configString = "{}";
  let outputDir = "./generated-app";

  // Process command line arguments
  const args = process.argv.slice(2);

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--config" && i + 1 < args.length) {
      configString = args[i + 1];
      i++; // Skip the next argument since we've used it
    } else if (arg === "--output-dir" && i + 1 < args.length) {
      outputDir = args[i + 1];
      i++; // Skip the next argument
    } else if (arg.startsWith("--config=")) {
      configString = arg.substring("--config=".length);
    } else if (arg.startsWith("--output-dir=")) {
      outputDir = arg.substring("--output-dir=".length);
    }
  }

  // Parse the config JSON
  let config: StoreConfig;
  try {
    config = JSON.parse(configString);
  } catch (error) {
    throw new Error(
      `Failed to parse configuration: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }

  return { config, outputDir };
}
