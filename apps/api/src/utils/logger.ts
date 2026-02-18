import pino from 'pino';

// Determine log level based on environment
const isDevelopment = process.env['NODE_ENV'] === 'development';

// Create pino logger instance
export const logger = pino({
  level: process.env['LOG_LEVEL'] || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined, // In production, use standard JSON format
  formatters: {
    level(label) {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

export type Logger = typeof logger;

// Export default to support dynamic imports
export default logger;
