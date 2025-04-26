import fs from "fs/promises";
import path from "path";
import { Logger } from "../cli/logger";

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

  /**
   * Recursively copy a directory and its contents
   * @param srcDir - Source directory
   * @param destDir - Destination directory
   */
  async copyDir(srcDir: string, destDir: string): Promise<void> {
    // Create destination directory if it doesn't exist
    await fs.mkdir(destDir, { recursive: true });

    // Read all entries in the source directory
    const entries = await fs.readdir(srcDir, { withFileTypes: true });

    // Process each entry
    for (const entry of entries) {
      const srcPath = path.join(srcDir, entry.name);
      const destPath = path.join(destDir, entry.name);

      if (entry.isDirectory()) {
        // Recursively copy subdirectories
        await this.copyDir(srcPath, destPath);
      } else {
        // Copy files
        await fs.copyFile(srcPath, destPath);
      }
    }
  }

  /**
   * Copy platform folders (android, ios) to the output directory
   * @param sourceDir - The source directory containing the folders to copy
   * @param outputDir - The target output directory where the folders will be copied
   */
  async copyPlatformFolders(
    sourceDir: string,
    outputDir: string,
    logger: Logger
  ): Promise<void> {
    const platformFolders = ["android", "ios"];

    for (const folder of platformFolders) {
      const sourcePath = path.join(sourceDir, folder);
      const destPath = path.join(outputDir, folder);

      try {
        // Check if source directory exists
        await fs.access(sourcePath);

        // Use recursive directory copying instead of file copying
        await this.copyDir(sourcePath, destPath);
        logger.info(`Copied ${folder} folder to ${destPath}`);
      } catch (error) {
        // Use the custom logger and throw the error to stop execution
        logger.error(
          `Failed to copy ${folder} folder from ${sourcePath}: ${error}`
        );
        throw new Error(`Platform folder copy failed: ${error}`);
      }
    }
  }
}
