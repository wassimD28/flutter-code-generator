import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { Logger } from "../cli/logger";

const execAsync = promisify(exec);

export class AppBuilder {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Runs Flutter commands to build the app
   *
   * @param appDir - Directory containing the generated Flutter app
   * @param outputFormat - Format of the output (apk, appbundle, etc.)
   * @returns Path to the built application
   */
  async buildApp(
    appDir: string,
    outputFormat: "apk" | "appbundle" | "ios" = "apk"
  ): Promise<string> {
    // Change to the app directory
    const currentDir = process.cwd();
    process.chdir(appDir);

    try {
      // Run flutter pub get to fetch dependencies
      this.logger.info("Installing Flutter dependencies...");
      await this.runCommand("flutter pub get");

      // Build the app based on the requested format
      this.logger.info(`Building ${outputFormat}...`);

      let outputPath = "";

      if (outputFormat === "apk") {
        await this.runCommand("flutter build apk --release");
        outputPath = path.join(
          appDir,
          "build",
          "app",
          "outputs",
          "flutter-apk",
          "app-release.apk"
        );
      } else if (outputFormat === "appbundle") {
        await this.runCommand("flutter build appbundle --release");
        outputPath = path.join(
          appDir,
          "build",
          "app",
          "outputs",
          "bundle",
          "release",
          "app-release.aab"
        );
      } else if (outputFormat === "ios") {
        await this.runCommand("flutter build ios --release --no-codesign");
        outputPath = path.join(appDir, "build", "ios", "iphoneos");
      }

      // Verify the build was successful
      await fs.access(outputPath);
      this.logger.success(
        `Successfully built ${outputFormat} at ${outputPath}`
      );

      return outputPath;
    } catch (error) {
      throw new Error(
        `Build failed: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    } finally {
      // Change back to the original directory
      process.chdir(currentDir);
    }
  }

  /**
   * Runs a command and logs its output
   */
  private async runCommand(command: string): Promise<void> {
    try {
      const { stdout, stderr } = await execAsync(command);

      if (stdout) {
        this.logger.debug(stdout);
      }

      if (stderr) {
        this.logger.warn(stderr);
      }
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Command execution failed: ${error.message}`);

        // If we have stdout/stderr from the failed command, log it
        if ("stdout" in error) {
          this.logger.debug(String(error.stdout));
        }
        if ("stderr" in error) {
          this.logger.error(String(error.stderr));
        }
      }

      throw error;
    }
  }
}
