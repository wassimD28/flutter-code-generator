import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";
import { ProjectStructure, StoreConfig } from "../models/config";
export class TemplateUtils {
  private baseTemplatesDir: string;
  private templatesCache: Map<string, HandlebarsTemplateDelegate>;

  constructor(baseTemplatesDir = path.join(__dirname, '..', 'templates')) {
    this.baseTemplatesDir = baseTemplatesDir;
    this.templatesCache = new Map();
    Handlebars.registerHelper("snakeCase", function (str) {
      if (typeof str !== "string") return "";

      // Convert camelCase boundaries to snake_case
      str = str.replace(/([a-z])([A-Z])/g, '$1_$2');

      // Replace spaces and non-word characters with underscores
      str = str.replace(/[\s\W]+/g, '_');

      // Convert to lowercase
      str = str.toLowerCase();

      // Remove any leading or trailing underscores
      str = str.replace(/^_+|_+$/g, '');

      return str;
    });

    Handlebars.registerHelper('pascalCase', (str: string) => {
      return str
        .split(/[-_\s]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
    });

    Handlebars.registerHelper('camelCase', (str: string) => {
      const pascalCased = Handlebars.helpers.pascalCase(str);
      return pascalCased.charAt(0).toLowerCase() + pascalCased.slice(1);
    });
    // Register Handlebars helpers
    Handlebars.registerHelper("toLowerCase", (str) => str.toLowerCase());

    // Add a slugify helper to create valid package names
    Handlebars.registerHelper("slugify", (str: string) => {
      // Convert to lowercase
      let slug = str.toLowerCase();

      // Replace non-alphanumeric characters with underscores
      slug = slug.replace(/[^a-z0-9]/g, '_');

      // Remove consecutive underscores
      slug = slug.replace(/_+/g, '_');

      // Ensure it starts with a letter
      if (/^[^a-z]/.test(slug)) {
        slug = 'app_' + slug;
      }

      return slug;
    });
  }

  /**
   * Load a template from file
   */
  private async loadTemplate(templateName: string, projectStructure: ProjectStructure): Promise<string> {
    let templatePath: string;
    if (templateName === "pubspec.yaml.hbs") {
      templatePath = path.join(this.baseTemplatesDir, templateName)
    } else {
      templatePath = path.join(this.baseTemplatesDir, projectStructure, templateName)
    }

    try {
      // Check if the file exists before reading
      await fs.access(templatePath);
      const templateContent = await fs.readFile(templatePath, "utf-8");
      return templateContent;
    } catch {
      throw new Error(`Failed to load template: ${templateName}.`)
    }
  }
  /**
   * Compile a template with provided context
   */
  async compileTemplate<T>(templateName: string, context: T, projectStructure?: ProjectStructure): Promise<string> {
    if (!projectStructure) {
      projectStructure = ProjectStructure.LIB;
    }
    // Check cache first
    if (!this.templatesCache.has(templateName)) {
      const templateSource = await this.loadTemplate(templateName, projectStructure);
      this.templatesCache.set(templateName, Handlebars.compile(templateSource));
    }

    const template = this.templatesCache.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return template(context);
  }
}


