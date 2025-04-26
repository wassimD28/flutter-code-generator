export class Logger {
  info(message: string): void {
    console.log(`\x1b[36m[INFO]\x1b[0m ${message}`);
  }

  success(message: string): void {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${message}`);
  }

  warn(message: string): void {
    console.warn(`\x1b[33m[WARNING]\x1b[0m ${message}`);
  }

  error(message: string): void {
    console.error(`\x1b[31m[ERROR]\x1b[0m ${message}`);
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.debug(`\x1b[34m[DEBUG]\x1b[0m ${message}`);
    }
  }
}
