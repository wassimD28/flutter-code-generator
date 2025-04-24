import path from "path";
import { ProcessedConfig, StoreConfig } from "../models/config";
import { FileUtils } from "../utils/file";
import { TemplateUtils } from "../utils/template";
import { ImageUtils } from "../utils/image";
import { Logger } from "../cli/logger";
import fs from "fs/promises";
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
    this.logger.info(
      `Processing configuration for store: ${config.metadata.storeName}`
    );

    return {
      ...config,
      appName: config.metadata.storeName || "StoreGo App",
      welcomeMessage: `Welcome to ${config.metadata.storeName}!`,
    };
  }

  /**
   * Generate Flutter app based on configuration
   */
  async generateApp(
    rawConfig: StoreConfig,
    outputDir: string
  ): Promise<string> {
    // Process config
    const config = this.processConfig(rawConfig);
    this.logger.info(`Generating app for: ${config.metadata.storeName}`);

    // Create directory structure based on projectStructure
    await this.fileUtils.createDirectoryStructure(outputDir);

    // Download all assets defined in config
    await this.downloadAssets(config, outputDir);

    // Generate project structure based on the config
    await this.generateProjectStructure(config, outputDir);

    // Create manifest file
    await this.createManifest(config, outputDir);

    this.logger.success(`App generated successfully at: ${outputDir}`);
    return outputDir;
  }

  // New method to download all assets
  private async downloadAssets(
    config: ProcessedConfig,
    outputDir: string
  ): Promise<void> {
    if (config.assets?.images) {
      for (const image of config.assets.images) {
        const imagePath = path.join(outputDir, image.path);
        await this.imageUtils.downloadImage(image.url, imagePath);
        this.logger.info(`Downloaded image to: ${imagePath}`);
      }
    }
  }

  // New method to generate the full project structure
  private async generateProjectStructure(
    config: ProcessedConfig,
    outputDir: string
  ): Promise<void> {
    const structure = config.projectStructure;

    // Generate entry point (main.dart)
    const entryPath = path.join(outputDir, structure.entry.path);
    const entryContent = await this.templateUtils.compileTemplate(
      "main.dart.hbs",
      config
    );
    await this.fileUtils.writeFile(entryPath, entryContent);
    this.logger.info(`Generated ${structure.entry.name}`);

    // Generate files for each section of the project structure
    await this.generateStructureSection(structure.core, config, outputDir);
    await this.generateStructureSection(structure.services, config, outputDir);
    await this.generateStructureSection(structure.theme, config, outputDir);
    await this.generateStructureSection(structure.utils, config, outputDir);
    await this.generateStructureSection(structure.dependency_injection, config, outputDir);
    await this.generateStructureSection(structure.shared_controllers, config, outputDir);
    await this.generateStructureSection(structure.shared_widgets, config, outputDir);
    await this.generateStructureSection(structure.button_components, config, outputDir);
    await this.generateStructureSection(structure.controllers, config, outputDir);
    await this.generateStructureSection(structure.models, config, outputDir);
    await this.generateStructureSection(structure.repositories, config, outputDir);
    await this.generateStructureSection(structure.bindings, config, outputDir);
    await this.generateStructureSection(structure.screens, config, outputDir);
    await this.generateStructureSection(structure.widgets, config, outputDir);
  }
  // Helper method to generate files for a section of the project structure
  private async generateStructureSection(
    items: Array<{ name: string; path: string }> | undefined,
    config: ProcessedConfig,
    outputDir: string
  ): Promise<void> {
    if (!items) return;

    for (const item of items) {
      try {
        // Create a template name based on the item's path
        const filename = path.basename(item.path);
        const templateName = `${filename}.hbs`;

        // Compile the template
        const content = await this.templateUtils.compileTemplate(
          templateName,
          config
        );

        // Write the file
        this.logger.info(`Generating ${item.name}`);
        const filePath = path.join(outputDir, item.path);
        await this.fileUtils.writeFile(filePath, content);
      } catch (error) {
        this.logger.warn(`Could not generate ${item.name}: ${error}`);
      }
    }
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
        storeId: config.metadata.storeId,
        storeName: config.metadata.storeName,
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
