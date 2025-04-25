import { parseArgs } from "./args";
import { Logger } from "./logger";
import { FlutterAppGenerator } from "../core/generator";
import { ConfigValidator } from "../core/validator";

async function main(): Promise<void> {
  const logger = new Logger();

  try {
    // Parse command line arguments
    const { config, outputDir, templateDir, projectStructureFile } =
      parseArgs();

    // Log what's being used
    logger.info(`Using config: ${JSON.stringify(config.metadata)}`);
    if (projectStructureFile) {
      logger.info(`Using project structure from: ${projectStructureFile}`);
    }
    if (templateDir) {
      logger.info(`Using templates from: ${templateDir}`);
    }

    // Validate configuration
    const validator = new ConfigValidator();
    const validationResult = validator.validate(config);

    if (!validationResult.valid) {
      logger.error(
        `Invalid configuration: ${validationResult.errors.join(", ")}`
      );
      process.exit(1);
    }

    // Generate the app
    const generator = new FlutterAppGenerator(logger, templateDir);
    await generator.generateApp(config, outputDir);

    logger.success("App generation completed successfully!");
  } catch (error) {
    logger.error(
      `App generation failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    process.exit(1);
  }
}

// Run the CLI
main();
