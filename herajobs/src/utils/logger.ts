// Utility for conditional logging
export const logger = {
  log: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(message, ...args);
    }
  },
  error: (message: string, ...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(message, ...args);
    }
  }
};
