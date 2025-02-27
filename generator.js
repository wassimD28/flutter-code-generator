// First, let's set up our project structure and dependencies
const fs = require("fs").promises;
const Handlebars = require("handlebars");
const path = require("path");

// This class will handle our app generation
class FlutterAppGenerator {
  constructor() {
    // Template for the main.dart file
    this.mainTemplate = `
import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: '{{appName}}',
      theme: ThemeData(
        primarySwatch: Colors.{{primaryColor}},
      ),
      home: const MyHomePage(),
    );
  }
}

class MyHomePage extends StatelessWidget {
  const MyHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('{{appName}}'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: const [
            Text(
              '{{welcomeMessage}}',
              style: TextStyle(fontSize: 24),
            ),
            {{#each features}}
            Text('{{this}}'),
            {{/each}}
          ],
        ),
      ),
    );
  }
}`;

    // Template for pubspec.yaml
    this.pubspecTemplate = `
name: {{appName}}
description: {{description}}
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=2.19.6 <3.0.0'

dependencies:
  flutter:
    sdk: flutter
  cupertino_icons: ^1.0.2

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^2.0.0

flutter:
  uses-material-design: true`;
  }

  // Generate the app based on configuration
  async generateApp(config) {
    const outputDir = `./${config.appName}`;

    // Create project directory structure
    await this.createDirectoryStructure(outputDir);

    // Compile templates
    const mainContent = this.compileTemplate(this.mainTemplate, config);
    const pubspecContent = this.compileTemplate(this.pubspecTemplate, config);

    // Write files
    await this.writeFile(`${outputDir}/lib/main.dart`, mainContent);
    await this.writeFile(`${outputDir}/pubspec.yaml`, pubspecContent);

    return outputDir;
  }

  // Helper to compile Handlebars template
  compileTemplate(template, context) {
    const compiledTemplate = Handlebars.compile(template);
    return compiledTemplate(context);
  }

  // Helper to create directory structure
  async createDirectoryStructure(baseDir) {
    await fs.mkdir(baseDir, { recursive: true });
    await fs.mkdir(`${baseDir}/lib`, { recursive: true });
  }

  // Helper to write files
  async writeFile(path, content) {
    await fs.writeFile(path, content);
  }
}

// Example usage
async function main() {
  const generator = new FlutterAppGenerator();

  // Configuration for the app
  const config = {
    appName: "MyTestApp",
    description: "A generated Flutter app",
    primaryColor: "blue",
    welcomeMessage: "Welcome to my generated app!",
    features: [
      "Feature 1: Auto-generated UI",
      "Feature 2: Customizable theme",
      "Feature 3: Easy to modify",
    ],
  };

  try {
    const outputDir = await generator.generateApp(config);
    console.log(`App generated successfully in ${outputDir}`);
  } catch (error) {
    console.error("Error generating app:", error);
  }
}

main();
