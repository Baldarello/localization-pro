import express from 'express';
import cors from 'cors';
import apiRouter from './src/routes/index.js';
import logger from './src/helpers/logger.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logger middleware
app.use((req, res, next) => {
    logger.info(`Request: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});


// API Routes
app.use('/api/v1', apiRouter);

// Basic 404 handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Not Found' });
});

// Error handler
app.use((err, req, res, next) => {
  // Log the error
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack);

  // Send response
  res.status(500).json({ message: 'Internal Server Error' });
});

export default app;
