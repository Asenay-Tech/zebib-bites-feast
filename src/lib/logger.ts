/**
 * Development-only logger utility
 * Prevents sensitive information from appearing in production console logs
 */
export const logger = {
  log: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.log(...args);
    }
  },
  error: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.error(...args);
    }
    // In production, errors should be sent to an error tracking service
  },
  warn: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.warn(...args);
    }
  },
  info: (...args: any[]) => {
    if (import.meta.env.DEV) {
      console.info(...args);
    }
  }
};
