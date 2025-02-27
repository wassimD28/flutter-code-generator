#!/usr/bin/env node
import { join } from "path";

// This shebang line (#!/usr/bin/env node) allows this file to be run as a CLI executable

// Import and run the CLI module
require("./cli");

// If you need to handle direct programmatic usage as well, you could export core functionality:
export { FlutterAppGenerator } from "./core/generator";
export { StoreConfig, ProcessedConfig } from "./models/config";
