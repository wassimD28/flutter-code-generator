import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";

export class TemplateUtils {
  private templatesDir: string;
  private templatesCache: Map<string, HandlebarsTemplateDelegate>;

  constructor(templatesDir = path.join(process.cwd(), "templates")) {
    this.templatesDir = templatesDir;
    this.templatesCache = new Map();

    // Register Handlebars helpers
    Handlebars.registerHelper("toLowerCase", (str) => str.toLowerCase());
    // Add more helpers as needed
  }

  /**
   * Load a template from file
   */
  private async loadTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(this.templatesDir, `${templateName}.hbs`);

    try {
      return await fs.readFile(templatePath, "utf-8");
    } catch (error) {
      throw new Error(`Failed to load template: ${templateName}`);
    }
  }

  /**
   * Compile a template with provided context
   */
  async compileTemplate<T>(templateName: string, context: T): Promise<string> {
    // Check cache first
    if (!this.templatesCache.has(templateName)) {
      const templateSource = await this.loadTemplate(templateName);
      this.templatesCache.set(templateName, Handlebars.compile(templateSource));
    }

    const template = this.templatesCache.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return template(context);
  }
}
