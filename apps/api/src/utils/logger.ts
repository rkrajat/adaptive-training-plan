import winston from "winston";

import { config } from "../config";

const isDevelopment = config.nodeEnv === "development";

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  isDevelopment
    ? winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
        const metaStr = Object.keys(meta).length
          ? `\n${JSON.stringify(meta, null, 2)}`
          : "";
        const stackStr = stack ? `\n${stack}` : "";
        return `${timestamp} [${level.toUpperCase()}]: ${message}${metaStr}${stackStr}`;
      })
    : winston.format.json()
);

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isDevelopment
      ? winston.format.combine(winston.format.colorize(), logFormat)
      : logFormat,
  }),
];

// Add file transports in production
if (!isDevelopment) {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

export const logger = winston.createLogger({
  level: isDevelopment ? "debug" : "info",
  format: logFormat,
  transports,
  exitOnError: false,
});

// Create typed logger methods for better developer experience
export const log = {
  info: (message: string, meta?: Record<string, unknown>) => {
    logger.info(message, meta);
  },
  error: (message: string, error?: Error | unknown, meta?: Record<string, unknown>) => {
    if (error instanceof Error) {
      logger.error(message, { error: error.message, stack: error.stack, ...meta });
    } else {
      logger.error(message, { error, ...meta });
    }
  },
  warn: (message: string, meta?: Record<string, unknown>) => {
    logger.warn(message, meta);
  },
  debug: (message: string, meta?: Record<string, unknown>) => {
    logger.debug(message, meta);
  },
};
