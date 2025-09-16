import winston from 'winston';
import 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';

const logDir = 'logs';

// Create the log directory if it does not exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const dailyRotateFileTransport = new winston.transports.DailyRotateFile({
  level: 'info',
  dirname: logDir,
  filename: 'combined-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
});

const errorTransport = new winston.transports.DailyRotateFile({
    level: 'error',
    dirname: logDir,
    filename: 'error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
});

const consoleTransport = new winston.transports.Console({
    level: 'debug',
    handleExceptions: true,
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    ),
});

const transports = [
    dailyRotateFileTransport,
    errorTransport,
];

// Log to console only in development environment
if (process.env.NODE_ENV === 'development') {
    transports.push(consoleTransport);
}

const logger = winston.createLogger({
  transports,
  exitOnError: false, // do not exit on handled exceptions
});

export default logger;
