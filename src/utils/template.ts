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
  private templatesDir: string;
  private templatesCache: Map<string, HandlebarsTemplateDelegate>;

  constructor(templatesDir?: string) {
    // If a custom templates dir is provided, use it directly
    // Otherwise, fall back to the default in src/templates
    this.templatesDir =
      templatesDir || path.join(__dirname, "..", "..", "src", "templates");

    // Debug log to confirm the template directory
    console.log(`[DEBUG] Using templates directory: ${this.templatesDir}`);

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
    templatePath: string,
    projectStructure: ProjectStructure
  ): Promise<string> {
    const resolvedPath = this.resolveTemplatePath(
      templatePath,
      projectStructure
    );

    // Debug log to show the resolved template path
    console.log(
      `[DEBUG] Resolving template: ${templatePath} to path: ${resolvedPath}`
    );

    return await this.readTemplateFile(resolvedPath);
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
    templatePath: string,
    context: T,
    projectStructure: ProjectStructure = ProjectStructure.LIB
  ): Promise<string> {
    // Generate a cache key that includes both template path and structure
    const cacheKey = `${projectStructure}:${templatePath}`;

    // Check cache first
    if (!this.templatesCache.has(cacheKey)) {
      const templateSource = await this.loadTemplate(
        templatePath,
        projectStructure
      );
      this.templatesCache.set(cacheKey, Handlebars.compile(templateSource));
    }

    const template = this.templatesCache.get(cacheKey);
    if (!template) {
      throw new Error(`Template not found: ${templatePath}`);
    }

    return template(context);
  }

  /**
   * Resolve the full path to a template file
   * FIXED: Uses project structure paths directly to find HBS files
   */
  resolveTemplatePath(
    filePath: string,
    projectStructure: ProjectStructure
  ): string {
    // This is the key fix - we look for the .hbs file that matches the path in the project structure
    // The filePath here should be directly from the projectStructure.*.path property

    // Always add .hbs extension if not already there
    const hbsExt = filePath.endsWith(".hbs") ? "" : ".hbs";

    // Resolve the path within the template directory
    return path.join(this.templatesDir, filePath + hbsExt);
  }
}
