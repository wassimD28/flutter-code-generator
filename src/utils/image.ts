import fs from "fs/promises";
import path from "path";
import axios from "axios";

export class ImageUtils {
  /**
   * Downloads an image from a URL and saves it to the specified path
   *
   * @param imageUrl - The URL of the image to download
   * @param outputPath - The path where the image will be saved
   * @returns Promise that resolves when the image is downloaded
   */
  async downloadImage(imageUrl: string, outputPath: string): Promise<void> {
    try {
      // Create the directory if it doesn't exist
      await fs.mkdir(path.dirname(outputPath), { recursive: true });

      // Download the image
      const response = await axios({
        method: "GET",
        url: imageUrl,
        responseType: "arraybuffer",
      });

      // Write the image to disk
      await fs.writeFile(outputPath, response.data);
    } catch (error) {
      throw new Error(
        `Failed to download image from ${imageUrl}: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Processes multiple images from a configuration
   *
   * @param config - Configuration containing image URLs
   * @param outputDir - Base directory for saving images
   * @returns Object mapping image types to their local paths
   */
  async processImages(
    config: { [key: string]: any },
    outputDir: string
  ): Promise<Record<string, string>> {
    const imageMapping: Record<string, string> = {};

    // Process logo
    if (config.logoUrl) {
      const logoPath = path.join(outputDir, "assets", "images", "logo.png");
      await this.downloadImage(config.logoUrl, logoPath);
      imageMapping.logo = "assets/images/logo.png";
    }

    // Process banner if available
    if (config.bannerUrl) {
      const bannerPath = path.join(outputDir, "assets", "images", "banner.png");
      await this.downloadImage(config.bannerUrl, bannerPath);
      imageMapping.banner = "assets/images/banner.png";
    }

    // Add more image types as needed

    return imageMapping;
  }
}
