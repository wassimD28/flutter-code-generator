import fs from 'fs';
import path from 'path';
import { StoreConfig } from '../models/config';

interface CLIArgs {
  config: string;
  outputDir: string;
}

export function parseArgs(): { config: StoreConfig; outputDir: string } {
  // Use node's process.argv to parse command-line arguments
  const args = process.argv.slice(2);
  
  const configIndex = args.findIndex(arg => arg === '--config');
  const outputIndex = args.findIndex(arg => arg === '--output');

  if (configIndex === -1 || outputIndex === -1) {
    throw new Error('Please provide both --config and --output arguments');
  }

  const configPath = args[configIndex + 1];
  const outputDir = args[outputIndex + 1];

  try {
    // Resolve absolute path for the config file
    const resolvedConfigPath = path.resolve(process.cwd(), configPath);
    
    // Read and parse the configuration file
    const rawConfig = fs.readFileSync(resolvedConfigPath, 'utf-8');
    const config: StoreConfig = JSON.parse(rawConfig);
    
    return { 
      config, 
      outputDir: path.resolve(process.cwd(), outputDir) 
    };
  } catch (error) {
    throw new Error(`Failed to parse configuration: ${error instanceof Error ? error.message : String(error)}`);
  }
}