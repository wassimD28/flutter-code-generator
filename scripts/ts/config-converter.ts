import fs from "fs";
import path from "path";
import { StoreConfig } from "../../src/models/config";
import {
  convertToQuickBuildConfig,
  convertToStoreConfig,
} from "../../src/utils/converter";
import { Logger } from "../../src/cli/logger";
import { QuickBuildConfig } from "../../src/models/quickBuild";

const logger = new Logger();

function printUsage() {
  console.log(`
Flutter Store Config Converter

Usage:
  ts-node scripts/ts/config-converter.ts --input <input-file> --output <output-file> [--direction <direction>]

Options:
  --input      Path to the input configuration file
  --output     Path to save the output configuration file
  --direction  Conversion direction (default: 'to-store')
               'to-quick': Convert StoreConfig to QuickBuildConfig
               'to-store': Convert QuickBuildConfig to StoreConfig
  --help       Show this help message

Examples:
  ts-node scripts/ts/config-converter.ts --input config.json --output quick-config.json --direction to-quick
  ts-node scripts/ts/config-converter.ts --input quick-config.json --output config.json 
  `);
}

async function main() {
  // Parse command line arguments
  const args = process.argv.slice(2);
  let inputFile: string | undefined;
  let outputFile: string | undefined;
  let direction: "to-quick" | "to-store" = "to-store";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--input" && i + 1 < args.length) {
      inputFile = args[i + 1];
    }
    if (args[i] === "--output" && i + 1 < args.length) {
      outputFile = args[i + 1];
    }
    if (args[i] === "--direction" && i + 1 < args.length) {
      const dirArg = args[i + 1];
      if (dirArg === "to-quick" || dirArg === "to-store") {
        direction = dirArg;
      } else {
        logger.error(
          `Invalid direction '${dirArg}'. Must be 'to-quick' or 'to-store'.`
        );
        process.exit(1);
      }
    }
    if (args[i] === "--help") {
      printUsage();
      process.exit(0);
    }
  }

  // Validate required arguments
  if (!inputFile) {
    logger.error("Input file not specified. Use --input flag.");
    printUsage();
    process.exit(1);
  }

  if (!outputFile) {
    logger.error("Output file not specified. Use --output flag.");
    printUsage();
    process.exit(1);
  }

  try {
    // Resolve absolute paths
    const resolvedInputPath = path.resolve(process.cwd(), inputFile);
    const resolvedOutputPath = path.resolve(process.cwd(), outputFile);

    // Check if input file exists
    if (!fs.existsSync(resolvedInputPath)) {
      logger.error(`Input file not found: ${resolvedInputPath}`);
      process.exit(1);
    }

    // Read and parse the input file
    const rawConfig = fs.readFileSync(resolvedInputPath, "utf-8");
    const parsedConfig = JSON.parse(rawConfig);

    // Convert based on the specified direction
    let result: StoreConfig | QuickBuildConfig;

    if (direction === "to-quick") {
      logger.info("Converting StoreConfig to QuickBuildConfig...");
      result = convertToQuickBuildConfig(parsedConfig as StoreConfig);
    } else {
      logger.info("Converting QuickBuildConfig to StoreConfig...");
      result = convertToStoreConfig(parsedConfig as QuickBuildConfig);
    }

    // Create the output directory if it doesn't exist
    const outputDir = path.dirname(resolvedOutputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the converted config to output file
    fs.writeFileSync(
      resolvedOutputPath,
      JSON.stringify(result, null, 2),
      "utf-8"
    );

    logger.success(
      `Configuration successfully converted and saved to: ${resolvedOutputPath}`
    );
  } catch (error) {
    logger.error(
      `Conversion failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }
}

// Run the CLI
main();
