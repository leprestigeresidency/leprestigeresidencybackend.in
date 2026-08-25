export const logger = {
  info: (message: string, meta?: Record<string, any>) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
  },
  warn: (message: string, meta?: Record<string, any>) => {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, meta ? meta : '');
  },
  error: (message: string, error?: any, meta?: Record<string, any>) => {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error ? error : '',
      meta ? meta : ''
    );
  }
};
