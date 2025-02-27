import path from "path";
import { ProcessedConfig, StoreConfig } from "../models/config";
import { FileUtils } from "../utils/file";
import { TemplateUtils } from "../utils/template";
import { ImageUtils } from "../utils/image";
import { Logger } from "../cli/logger";

export class FlutterAppGenerator {
  private fileUtils: FileUtils;
  private templateUtils: TemplateUtils;
  private imageUtils: ImageUtils;
  private logger: Logger;

  constructor(logger: Logger) {
    this.fileUtils = new FileUtils();
    this.templateUtils = new TemplateUtils();
    this.imageUtils = new ImageUtils();
    this.logger = logger;
  }

  /**
   * Process raw configuration and apply defaults
   */
  processConfig(config: StoreConfig): ProcessedConfig {
    this.logger.info(`Processing configuration for store: ${config.storeName}`);

    return {
      ...config,
      appName: config.storeName || "StoreGo App",
      description: config.description || `Mobile app for ${config.storeName}`,
      primaryColor: config.primaryColor || "blue",
      welcomeMessage: `Welcome to ${config.storeName}!`,
    };
  }

  /**
   * Generate Flutter app based on configuration
   */
  async generateApp(
    rawConfig: StoreConfig,
    outputDir: string
  ): Promise<string> {
    // Process and validate config
    const config = this.processConfig(rawConfig);
    this.logger.info(`Generating app for: ${config.appName}`);

    // Create directory structure
    await this.fileUtils.createDirectoryStructure(outputDir);

    // Download assets if available
    if (config.logoUrl) {
      const logoPath = path.join(outputDir, "assets", "images", "logo.png");
      await this.imageUtils.downloadImage(config.logoUrl, logoPath);
      this.logger.info(`Downloaded logo to: ${logoPath}`);
    }

    // Generate main.dart
    const mainContent = await this.templateUtils.compileTemplate(
      "main",
      config
    );
    await this.fileUtils.writeFile(
      path.join(outputDir, "lib", "main.dart"),
      mainContent
    );

    // Generate pubspec.yaml
    const pubspecContent = await this.templateUtils.compileTemplate(
      "pubspec",
      config
    );
    await this.fileUtils.writeFile(
      path.join(outputDir, "pubspec.yaml"),
      pubspecContent
    );

    // Generate other files
    await this.generateAdditionalFiles(config, outputDir);

    // Create manifest file for debugging
    await this.createManifest(config, outputDir);

    this.logger.success(`App generated successfully at: ${outputDir}`);
    return outputDir;
  }

  /**
   * Generate additional app files based on configuration
   */
  private async generateAdditionalFiles(
    config: ProcessedConfig,
    outputDir: string
  ): Promise<void> {
    // Generate screens, models, etc.
    // This would expand based on your needs
    this.logger.info("Generating additional files...");
  }

  /**
   * Create a manifest file containing generation details
   */
  private async createManifest(
    config: ProcessedConfig,
    outputDir: string
  ): Promise<void> {
    const manifest = {
      generatedAt: new Date().toISOString(),
      config: {
        storeId: config.storeId,
        storeName: config.storeName,
        // Include non-sensitive config details
      },
      files: await this.fileUtils.getGeneratedFilesList(outputDir),
    };

    await this.fileUtils.writeFile(
      path.join(outputDir, "generation-manifest.json"),
      JSON.stringify(manifest, null, 2)
    );
  }
}
