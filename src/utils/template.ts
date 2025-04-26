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
    // Use the provided templates directory or fall back to default
    this.templatesDir =
      templatesDir || path.join(__dirname, "..", "..", "src", "templates");

    console.log(`[DEBUG] Using templates directory: ${this.templatesDir}`);
    this.templatesCache = new Map();
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
   * Loads a template from file based on the project structure path
   */
  async loadTemplate(
    templatePath: string,
    projectStructure: ProjectStructure
  ): Promise<string> {
    const resolvedPath = this.resolveTemplatePath(
      templatePath,
      projectStructure
    );
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
      await fs.access(templatePath);
      return await fs.readFile(templatePath, "utf-8");
    } catch (error) {
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
    const cacheKey = `${projectStructure}:${templatePath}`;

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
   * Resolves the template path based on the project structure path
   * The key insight is that template files exactly match the project structure paths
   * but are located within the templates directory with .hbs extension
   */
  resolveTemplatePath(
    filePath: string,
    projectStructure: ProjectStructure
  ): string {
    // Always add .hbs extension if not already there
    const hbsExt = filePath.endsWith(".hbs") ? "" : ".hbs";

    // Use the full path from your project structure to find the template
    // This ensures "lib/main.dart" becomes "src/templates/fashion/lib/main.dart.hbs"
    return path.join(this.templatesDir, filePath + hbsExt);
  }
}
