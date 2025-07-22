// Utility for conditional logging
/**
 * logger.ts
 *
 * Utility for conditional logging in development mode.
 * Only logs messages if running in a development environment.
 *
 * Exports:
 * - logger: Logging utility with log and error methods
 *
 * Author: Hera Health Solutions
 * Last updated: 2025-07-22
 */

export const logger = {
  /**
   * Log a message to the console (dev only).
   * @param message The message to log
   * @param args Additional arguments
   */
  log: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(message, ...args);
    }
  },
  /**
   * Log an error to the console (dev only).
   * @param message The error message
   * @param args Additional arguments
   */
  error: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(message, ...args);
    }
  }
};
