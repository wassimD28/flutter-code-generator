import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";

// Define the ProjectStructure enum
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
    // If a custom templates dir is provided, use it directly
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
    // Your existing helper registrations...
    Handlebars.registerHelper("snakeCase", function (str) {
      if (typeof str !== "string") return "";
      str = str.replace(/([a-z])([A-Z])/g, "$1_$2");
      str = str.replace(/[\s\W]+/g, "_");
      str = str.toLowerCase();
      str = str.replace(/^_+|_+$/g, "");
      return str;
    });

    // Other helpers...
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

    Handlebars.registerHelper("slugify", (str: string) => {
      let slug = str.toLowerCase();
      slug = slug.replace(/[^a-z0-9]/g, "_");
      slug = slug.replace(/_+/g, "_");
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
   * FIXED: Improved path resolution for different file types
   */
  resolveTemplatePath(
    templateNameOrPath: string,
    projectStructure: ProjectStructure
  ): string {
    // First, clean up the path by removing any leading template folder name
    // For example, if path is "fashion/android/app/build.gradle.kts"
    // Extract just "android/app/build.gradle.kts"
    let cleanPath = templateNameOrPath;

    // Remove template name prefix if it exists (e.g., "fashion/")
    if (
      cleanPath.includes("/") &&
      !cleanPath.startsWith("lib/") &&
      !cleanPath.startsWith("android/") &&
      !cleanPath.startsWith("ios/")
    ) {
      cleanPath = cleanPath.substring(cleanPath.indexOf("/") + 1);
    }

    // Special case for pubspec.yaml
    if (cleanPath === "pubspec.yaml") {
      return path.join(this.baseTemplatesDir, "pubspec.yaml.hbs");
    }

    // Handle Gradle files (build.gradle, build.gradle.kts, etc.)
    if (
      cleanPath.includes("build.gradle") ||
      cleanPath.includes("gradle.properties") ||
      cleanPath.includes("settings.gradle")
    ) {
      return path.join(this.baseTemplatesDir, cleanPath + ".hbs");
    }

    // Handle AndroidManifest.xml
    if (cleanPath.includes("AndroidManifest.xml")) {
      return path.join(this.baseTemplatesDir, cleanPath + ".hbs");
    }

    // Handle iOS files
    if (cleanPath.startsWith("ios/")) {
      return path.join(this.baseTemplatesDir, cleanPath + ".hbs");
    }

    // Handle lib files
    if (cleanPath.startsWith("lib/")) {
      // Remove "lib/" prefix as it's already part of the template directory structure
      const libPath = cleanPath.substring(4);
      return path.join(this.baseTemplatesDir, "lib", libPath + ".hbs");
    }

    // For paths with directories
    if (cleanPath.includes("/")) {
      const filename = path.basename(cleanPath);
      const dirPath = path.dirname(cleanPath);

      // Determine the correct base directory based on projectStructure
      if (projectStructure === ProjectStructure.LIB) {
        return path.join(
          this.baseTemplatesDir,
          "lib",
          dirPath,
          filename + ".hbs"
        );
      } else {
        return path.join(
          this.baseTemplatesDir,
          projectStructure.toString(),
          dirPath,
          filename + ".hbs"
        );
      }
    }

    // For simple template names
    return path.join(
      this.baseTemplatesDir,
      projectStructure.toString(),
      templateNameOrPath
    );
  }
}
