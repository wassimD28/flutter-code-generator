import fs from "fs/promises";
import path from "path";

export class FileUtils {
  /**
   * Create directory structure recursively
   */
  async createDirectoryStructure(baseDir: string): Promise<void> {
    const directories = [
      baseDir,
      path.join(baseDir, "lib"),
      path.join(baseDir, "assets"),
      path.join(baseDir, "assets", "images"),
      // Add more directories as needed
    ];

    for (const dir of directories) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  /**
   * Write content to a file, creating parent directories if needed
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content, "utf-8");
  }

  /**
   * Get list of all files generated in the output directory
   */
  async getGeneratedFilesList(dir: string): Promise<string[]> {
    const files: string[] = [];

    async function scanDir(directory: string) {
      const entries = await fs.readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
          await scanDir(fullPath);
        } else {
          files.push(fullPath);
        }
      }
    }

    await scanDir(dir);
    return files;
  }
  /**
   * Check if a file exists
   */
  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
}
