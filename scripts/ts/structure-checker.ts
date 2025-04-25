import fs from "fs";
import path from "path";

function checkProjectStructureFile(filePath: string): void {
  try {
    // Resolve the path
    const resolvedPath = path.resolve(process.cwd(), filePath);

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      console.error(`File not found: ${resolvedPath}`);
      process.exit(1);
    }

    // Read and parse the file
    const content = fs.readFileSync(resolvedPath, "utf-8");
    const structure = JSON.parse(content);

    // Check for key sections
    console.log("Project Structure Analysis:");
    console.log("---------------------------");
    console.log(`File: ${resolvedPath}`);
    console.log("---------------------------");

    // Check entry point
    if (!structure.entry) {
      console.error('ERROR: Missing "entry" section in project structure');
    } else {
      console.log("Entry point:");
      console.log(`  - Name: ${structure.entry.name || "MISSING"}`);
      console.log(`  - Path: ${structure.entry.path || "MISSING"}`);
    }

    // Check other key sections
    const keySections = [
      "core",
      "services",
      "theme",
      "utils",
      "dependency_injection",
      "shared_controllers",
      "shared_widgets",
      "button_components",
      "controllers",
      "models",
      "repositories",
      "bindings",
      "screens",
      "widgets",
      "project_config",
    ];

    console.log("\nOther sections:");
    for (const section of keySections) {
      if (!structure[section]) {
        console.log(`  - ${section}: MISSING`);
      } else {
        console.log(`  - ${section}: ${structure[section].length} items`);
      }
    }

    // Check for unexpected sections
    const allSections = Object.keys(structure);
    const unexpectedSections = allSections.filter(
      (section) => !keySections.includes(section) && section !== "entry"
    );

    if (unexpectedSections.length > 0) {
      console.log("\nUnexpected sections:");
      for (const section of unexpectedSections) {
        console.log(`  - ${section}`);
      }
    }

    console.log("\nStructure validation complete.");
  } catch (error) {
    console.error("Error analyzing project structure:");
    console.error(error);
    process.exit(1);
  }
}

// If running directly
if (require.main === module) {
  // Default to the fashion.json file if no argument is provided
  const filePath = process.argv[2] || "project-structure/fashion.json";
  checkProjectStructureFile(filePath);
}
