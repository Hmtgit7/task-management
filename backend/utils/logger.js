const winston = require("winston");
require("dotenv").config();

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Determine level based on environment
const level = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "development" ? "debug" : "warn";
};

// Configure transports
const transports = [
  // Console transport for all logs
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize({ all: true }),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
      )
    ),
  }),
  // File transport for all logs
  new winston.transports.File({
    filename: "logs/combined.log",
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
  // File transport for error logs
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
    maxsize: 10485760, // 10MB
    maxFiles: 5,
  }),
];

// Create logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format: logFormat,
  transports,
  exceptionHandlers: [
    new winston.transports.File({ filename: "logs/exceptions.log" }),
  ],
  rejectionHandlers: [
    new winston.transports.File({ filename: "logs/rejections.log" }),
  ],
});

// If we're not in production, log to console with formatted output
if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Create a stream object for Morgan
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  },
};

module.exports = logger;
