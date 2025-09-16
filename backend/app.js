import express from 'express';
import cors from 'cors';
import apiRouter from './src/routes/index.js';
import logger from './src/helpers/logger.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerOptions from './swaggerConfig.js';

const app = express();
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Middleware
// FIX: Updated CORS configuration to be more explicit for cross-origin requests from iframes.
app.use(cors({
  origin: '*', // Allow all origins
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logger middleware
app.use((req, res, next) => {
    logger.info(`Request: ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
    next();
});

// --- Swagger Docs ---
// Serve the interactive Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Serve the raw openapi.json for compatibility with the existing frontend component
app.get('/openapi.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
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