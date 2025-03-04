import fs from "fs/promises";
import path from "path";
import Handlebars from "handlebars";

export class TemplateUtils {
  private templatesDir: string;
  private templatesCache: Map<string, HandlebarsTemplateDelegate>;

  constructor(templatesDir = path.join(__dirname, '..', 'templates')) {
    this.templatesDir = templatesDir;
    this.templatesCache = new Map();

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
  private async loadTemplate(templateName: string): Promise<string> {
  // Adjust the file extension based on the template name
  const fileExtension = templateName === 'pubspec' ? 'yaml.hbs' : 'dart.hbs';
  const templatePath = path.join(this.templatesDir, `${templateName}.${fileExtension}`);

  console.log(`Attempting to load template: ${templatePath}`);

  try {
    // Check if the file exists before reading
    await fs.access(templatePath);
    const templateContent = await fs.readFile(templatePath, "utf-8");
    
    console.log(`Template loaded successfully. Content length: ${templateContent.length}`);
    return templateContent;
  } catch (error) {
    console.error(`Template loading error for ${templatePath}:`, error);
    
    // List files in the templates directory to help diagnose
    try {
      const files = await fs.readdir(this.templatesDir);
      console.log('Available template files:', files);
    } catch (dirError) {
      console.error('Could not list template directory:', dirError);
    }

    throw new Error(`Failed to load template: ${templateName}. Check template path and file existence.`);
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