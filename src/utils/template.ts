import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";

// Define the ProjectStructure enum that was missing
export enum ProjectStructure {
  LIB = "lib",
  ROOT = "root",
  ASSETS = "assets",
  ANDROID = "android",
  IOS = "ios",
}
export class TemplateUtils {
  private baseTemplatesDir: string;
  private templatesCache: Map<string, HandlebarsTemplateDelegate>;

  constructor(baseTemplatesDir?: string) {
    // FIXED: If a custom templates dir is provided, use it directly
    // Otherwise, fall back to the default in src/templates
    this.baseTemplatesDir =
      baseTemplatesDir || path.join(__dirname, "..", "..", "src", "templates");

    // Debug log to confirm the template directory
    console.log(`[DEBUG] Using templates directory: ${this.baseTemplatesDir}`);

    this.templatesCache = new Map();

    // Register Handlebars helpers
    this.registerHelpers();
  }

  /**
   * Register all Handlebars helpers
   */
  private registerHelpers(): void {
    Handlebars.registerHelper("snakeCase", function (str) {
      if (typeof str !== "string") return "";

      // Convert camelCase boundaries to snake_case
      str = str.replace(/([a-z])([A-Z])/g, "$1_$2");

      // Replace spaces and non-word characters with underscores
      str = str.replace(/[\s\W]+/g, "_");

      // Convert to lowercase
      str = str.toLowerCase();

      // Remove any leading or trailing underscores
      str = str.replace(/^_+|_+$/g, "");

      return str;
    });

    Handlebars.registerHelper("pascalCase", (str: string) => {
      return str
        .split(/[-_\s]/)
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        )
        .join("");
    });

    Handlebars.registerHelper("camelCase", (str: string) => {
      const pascalCased = Handlebars.helpers.pascalCase(str);
      return pascalCased.charAt(0).toLowerCase() + pascalCased.slice(1);
    });

    Handlebars.registerHelper("toLowerCase", (str) => str.toLowerCase());

    // Add a slugify helper to create valid package names
    Handlebars.registerHelper("slugify", (str: string) => {
      // Convert to lowercase
      let slug = str.toLowerCase();

      // Replace non-alphanumeric characters with underscores
      slug = slug.replace(/[^a-z0-9]/g, "_");

      // Remove consecutive underscores
      slug = slug.replace(/_+/g, "_");

      // Ensure it starts with a letter
      if (/^[^a-z]/.test(slug)) {
        slug = "app_" + slug;
      }

      return slug;
    });
  }

  /**
   * Load a template from file with improved path handling
   */
  async loadTemplate(
    templateNameOrPath: string,
    projectStructure: ProjectStructure
  ): Promise<string> {
    const templatePath = this.resolveTemplatePath(
      templateNameOrPath,
      projectStructure
    );

    // Debug log to show the resolved template path
    console.log(
      `[DEBUG] Resolving template: ${templateNameOrPath} to path: ${templatePath}`
    );

    return await this.readTemplateFile(templatePath);
  }

  /**
   * Helper method to read template file
   */
  private async readTemplateFile(templatePath: string): Promise<string> {
    try {
      // Check if the file exists before reading
      await fs.access(templatePath);
      const templateContent = await fs.readFile(templatePath, "utf-8");
      return templateContent;
    } catch (error) {
      // Enhanced error message with more debugging info
      throw new Error(
        `Template not found at path: ${templatePath}. Please ensure the template exists before running the generator. Current working directory: ${process.cwd()}`
      );
    }
  }

  /**
   * Compile a template with provided context
   */
  async compileTemplate<T>(
    templateNameOrPath: string,
    context: T,
    projectStructure: ProjectStructure = ProjectStructure.LIB
  ): Promise<string> {
    // Generate a cache key that includes both template name and structure
    const cacheKey = `${projectStructure}:${templateNameOrPath}`;

    // Check cache first
    if (!this.templatesCache.has(cacheKey)) {
      const templateSource = await this.loadTemplate(
        templateNameOrPath,
        projectStructure
      );
      this.templatesCache.set(cacheKey, Handlebars.compile(templateSource));
    }

    const template = this.templatesCache.get(cacheKey);
    if (!template) {
      throw new Error(`Template not found: ${templateNameOrPath}`);
    }

    return template(context);
  }

  /**
   * Resolve the full path to a template file
   */
  resolveTemplatePath(
    templateNameOrPath: string,
    projectStructure: ProjectStructure
  ): string {
    // Special case for pubspec.yaml
    if (templateNameOrPath === "pubspec.yaml") {
      return path.join(this.baseTemplatesDir, "pubspec.yaml.hbs");
    }

    // Special case handling for different file types
    if (
      templateNameOrPath === "pubspec.yaml" ||
      templateNameOrPath.endsWith("pubspec.yaml")
    ) {
      // Handle the pubspec.yaml file
      return path.join(this.baseTemplatesDir, "pubspec.yaml.hbs");
    } else if (templateNameOrPath.includes("AndroidManifest.xml")) {
      // Handle the AndroidManifest.xml file
      const relativePath = templateNameOrPath.replace("android/", "");
      const dirPath = path.dirname(relativePath);
      return path.join(
        this.baseTemplatesDir,
        "android",
        dirPath,
        "AndroidManifest.xml.hbs"
      );
    } else if (
      templateNameOrPath.includes("build.gradle") ||
      templateNameOrPath.includes("gradle.properties") ||
      templateNameOrPath.includes("settings.gradle")
    ) {
      // Handle gradle files
      const relativePath = templateNameOrPath.replace("android/", "");
      const dirPath = path.dirname(relativePath);
      const filename = path.basename(templateNameOrPath);
      return path.join(
        this.baseTemplatesDir,
        "android",
        dirPath,
        `${filename}.hbs`
      );
    } else if (templateNameOrPath.includes("ios/")) {
      // Handle iOS files
      const relativePath = templateNameOrPath.replace("ios/", "");
      const dirPath = path.dirname(relativePath);
      const filename = path.basename(templateNameOrPath);
      return path.join(
        this.baseTemplatesDir,
        "ios",
        dirPath,
        `${filename}.hbs`
      );
    } else if (templateNameOrPath.includes("/")) {
      // This is a path from config.json like "lib/app/core/config/routes_config.dart"
      // Extract the filename from the path
      const filename = path.basename(templateNameOrPath);

      // Create the template filename (add .hbs extension)
      const templateFilename = `${filename}.hbs`;

      // Create the directory structure mirroring the config path
      // Note: We remove the "lib/" prefix if it exists since it's already in the templates dir structure
      let relativePath = templateNameOrPath;
      if (relativePath.startsWith("lib/")) {
        relativePath = relativePath.substring(4); // Remove "lib/" prefix
      }

      // Extract the directory part of the path
      const dirPath = path.dirname(relativePath);

      // Construct the full template path based on projectStructure
      if (projectStructure === ProjectStructure.LIB) {
        return path.join(
          this.baseTemplatesDir,
          "lib",
          dirPath,
          templateFilename
        );
      } else {
        return path.join(
          this.baseTemplatesDir,
          projectStructure.toString(),
          dirPath,
          templateFilename
        );
      }
    } else {
      // This is just a template name like "main.dart.hbs"
      return path.join(
        this.baseTemplatesDir,
        projectStructure.toString(),
        templateNameOrPath
      );
    }
  }
}
