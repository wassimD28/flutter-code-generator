import path from "path";
import { ProcessedConfig, StoreConfig } from "../models/config";
import { FileUtils } from "../utils/file";
import { ProjectStructure, TemplateUtils } from "../utils/template";
import { ImageUtils } from "../utils/image";
import { Logger } from "../cli/logger";

export class FlutterAppGenerator {
  private fileUtils: FileUtils;
  private templateUtils: TemplateUtils;
  private imageUtils: ImageUtils;
  private logger: Logger;

  constructor(logger: Logger, templatesDir?: string) {
    this.fileUtils = new FileUtils();
    this.templateUtils = new TemplateUtils(templatesDir);
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

    // Validate templates before starting generation
    this.logger.info("Validating templates...");
    const templatesValid = await this.validateTemplates(config);
    if (!templatesValid) {
      throw new Error("Generation failed due to missing template files");
    }

    // Create directory structure based on projectStructure
    await this.fileUtils.createDirectoryStructure(outputDir);
    this.logger.info(`Created directory structure at: ${outputDir}`);
    await this.fileUtils.copyPlatformFolders("src/platform-folders", outputDir);
    this.logger.info(`Copied platform folders to: ${outputDir}`);
    // Download all assets defined in config
    await this.downloadAssets(config, outputDir);

    // Generate project structure based on the config
    await this.generateProjectStructure(config, outputDir);

    // Create manifest file
    await this.createManifest(config, outputDir);

    this.logger.success(`App generated successfully at: ${outputDir}`);
    return outputDir;
  }

  // Download all assets
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

  // Generate the full project structure
  private async generateProjectStructure(
    config: ProcessedConfig,
    outputDir: string
  ): Promise<void> {
    const structure = config.projectStructure;

    // Generate entry point (main.dart)
    const entryPath = path.join(outputDir, structure.entry.path);
    const entryContent = await this.templateUtils.compileTemplate(
      structure.entry.path, // Use full path from the structure
      config
    );
    await this.fileUtils.writeFile(entryPath, entryContent);
    this.logger.info(`Generated ${structure.entry.name}`);

    // Generate files for each section of the project structure
    await this.generateStructureSection(structure.core, config, outputDir);
    await this.generateStructureSection(structure.services, config, outputDir);
    await this.generateStructureSection(structure.theme, config, outputDir);
    await this.generateStructureSection(structure.utils, config, outputDir);
    await this.generateStructureSection(
      structure.dependency_injection,
      config,
      outputDir
    );
    await this.generateStructureSection(
      structure.shared_controllers,
      config,
      outputDir
    );
    await this.generateStructureSection(
      structure.shared_widgets,
      config,
      outputDir
    );
    await this.generateStructureSection(
      structure.button_components,
      config,
      outputDir
    );
    await this.generateStructureSection(
      structure.controllers,
      config,
      outputDir
    );
    await this.generateStructureSection(structure.models, config, outputDir);
    await this.generateStructureSection(
      structure.repositories,
      config,
      outputDir
    );
    await this.generateStructureSection(structure.bindings, config, outputDir);
    await this.generateStructureSection(structure.screens, config, outputDir);
    await this.generateStructureSection(structure.widgets, config, outputDir);

    // Generate project configuration files (pubspec.yaml, AndroidManifest.xml, build.gradle.kts)
    await this.generateStructureSection(
      structure.project_config,
      config,
      outputDir,
      (path) => this.determineProjectStructureType(path) // Pass the method properly
    );
  }

  // Helper method to generate files for a section of the project structure
  private async generateStructureSection(
    items: Array<{ name: string; path: string }> | undefined,
    config: ProcessedConfig,
    outputDir: string,
    structureTypeCallback?: (path: string) => ProjectStructure
  ): Promise<void> {
    if (!items) return;

    for (const item of items) {
      // Log which file we're generating
      this.logger.info(`Generating ${item.name} from path ${item.path}`);

      // Determine the appropriate ProjectStructure type
      const structureType = structureTypeCallback
        ? structureTypeCallback(item.path)
        : ProjectStructure.LIB;

      // Compile the template using the full path from config
      const content = await this.templateUtils.compileTemplate(
        item.path,
        config,
        structureType
      );

      // Fix: Write the file directly to the output directory + item path
      // This ensures we don't add any template folder name to the output path
      const filePath = path.join(outputDir, item.path);
      await this.fileUtils.writeFile(filePath, content);

      this.logger.debug(`Generated file written to: ${filePath}`);
    }
  }

  // Helper method to determine the ProjectStructure type based on file path
  private determineProjectStructureType(filePath: string): ProjectStructure {
    if (filePath.includes("android/")) {
      return ProjectStructure.ANDROID;
    } else if (filePath === "pubspec.yaml") {
      return ProjectStructure.ROOT;
    } else if (filePath.includes("assets/")) {
      return ProjectStructure.ASSETS;
    } else if (filePath.includes("ios/")) {
      return ProjectStructure.IOS;
    } else if (filePath.includes("lib/")) {
      return ProjectStructure.LIB;
    } else {
      // Default to ROOT for any files in the project root
      return ProjectStructure.ROOT;
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

  // Template validation method that organizes errors by category
  private async validateTemplates(config: ProcessedConfig): Promise<boolean> {
    // Create a structured object to group missing templates by category
    const missingTemplates: Record<string, string[]> = {
      core: [],
      services: [],
      theme: [],
      utils: [],
      controllers: [],
      models: [],
      repositories: [],
      bindings: [],
      screens: [],
      widgets: [],
      project_config: [],
      other: [],
    };

    // Check if the project structure is defined
    if (!config.projectStructure) {
      this.logger.error(
        "Project structure is not defined in the configuration"
      );
      return false;
    }

    // Check main entry template
    try {
      // First, check if entry exists
      if (!config.projectStructure.entry) {
        this.logger.error(
          "Entry point is not defined in the project structure"
        );
        missingTemplates.core.push("entry point (main.dart.hbs)");
      } else {
        const entryTemplateType = this.determineProjectStructureType(
          config.projectStructure.entry.path
        );
        const entryTemplatePath = this.templateUtils.resolveTemplatePath(
          config.projectStructure.entry.path,
          entryTemplateType
        );
        await this.fileUtils.fileExists(entryTemplatePath);
      }
    } catch (error) {
      missingTemplates.core.push("main.dart.hbs");
      this.logger.debug(
        `Failed to find entry template: ${
          config.projectStructure.entry?.path || "undefined"
        }`
      );
    }

    // Helper function to check templates for a structure section
    const checkTemplatesForSection = async (
      items: Array<{ name: string; path: string }> | undefined,
      category: string
    ) => {
      if (!items) return;

      for (const item of items) {
        try {
          // Determine the appropriate ProjectStructure type
          const structureType = this.determineProjectStructureType(item.path);

          // Check if the template file exists in the specified template directory
          const templatePath = this.templateUtils.resolveTemplatePath(
            item.path,
            structureType
          );

          // Try to access the file to verify it exists
          await this.fileUtils.fileExists(templatePath);
        } catch (error) {
          // Add to the appropriate category
          const filename = path.basename(item.path);
          const templateName = `${filename}.hbs`;

          if (missingTemplates[category]) {
            missingTemplates[category].push(templateName);
          } else {
            missingTemplates.other.push(templateName);
          }

          // Log the actual path we're trying to access for debugging
          this.logger.debug(`Failed to find template: ${item.path}`);
        }
      }
    };

    // Check templates for each section, mapping to the appropriate category
    await checkTemplatesForSection(config.projectStructure.core, "core");
    await checkTemplatesForSection(
      config.projectStructure.services,
      "services"
    );
    await checkTemplatesForSection(config.projectStructure.theme, "theme");
    await checkTemplatesForSection(config.projectStructure.utils, "utils");
    await checkTemplatesForSection(
      config.projectStructure.dependency_injection,
      "core"
    );
    await checkTemplatesForSection(
      config.projectStructure.shared_controllers,
      "controllers"
    );
    await checkTemplatesForSection(
      config.projectStructure.shared_widgets,
      "widgets"
    );
    await checkTemplatesForSection(
      config.projectStructure.button_components,
      "widgets"
    );
    await checkTemplatesForSection(
      config.projectStructure.controllers,
      "controllers"
    );
    await checkTemplatesForSection(config.projectStructure.models, "models");
    await checkTemplatesForSection(
      config.projectStructure.repositories,
      "repositories"
    );
    await checkTemplatesForSection(
      config.projectStructure.bindings,
      "bindings"
    );
    await checkTemplatesForSection(config.projectStructure.screens, "screens");
    await checkTemplatesForSection(config.projectStructure.widgets, "widgets");
    await checkTemplatesForSection(
      config.projectStructure.project_config,
      "project_config"
    );

    // Check if we have any missing templates
    const hasMissingTemplates = Object.values(missingTemplates).some(
      (category) => category.length > 0
    );

    // Log them in a structured, organized format
    if (hasMissingTemplates) {
      this.logger.error("Missing template files:");

      // Log missing templates by category
      for (const [category, templates] of Object.entries(missingTemplates)) {
        if (templates.length > 0) {
          this.logger.error(
            `\n${category.toUpperCase()} (${templates.length} files):`
          );

          // Format each category's templates in columns (3 per line)
          let line = "";
          for (let i = 0; i < templates.length; i++) {
            const paddedTemplate = templates[i].padEnd(40);
            line += paddedTemplate;

            // Break into columns of 3
            if ((i + 1) % 3 === 0 || i === templates.length - 1) {
              this.logger.error(`  ${line.trimEnd()}`);
              line = "";
            }
          }
        }
      }

      // Count total missing templates
      const totalMissing = Object.values(missingTemplates).reduce(
        (sum, templates) => sum + templates.length,
        0
      );
      this.logger.error(`\nTotal missing templates: ${totalMissing}`);

      return false;
    }

    return true;
  }
}
