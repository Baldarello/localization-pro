import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import apiRouter from './src/routes/index.js';
import logger from './src/helpers/logger.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerOptions from './swaggerConfig.js';
import './src/config/passport.js'; // This configures the Passport strategies

const app = express();
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Middleware
// Allow cross-origin requests, especially for credentials (cookies)
app.use(cors({
  origin: true, // Reflect the request origin, resolves CORS issues in development.
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session middleware
let sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
    if (process.env.NODE_ENV === 'production') {
        logger.error('FATAL ERROR: SESSION_SECRET is not defined in the environment variables. This is required for production.');
        process.exit(1);
    } else {
        sessionSecret = 'a-very-insecure-dev-secret-do-not-use-in-prod';
        logger.warn('**********************************************************************************');
        logger.warn('WARNING: SESSION_SECRET is not defined. Using an insecure default secret for development.');
        logger.warn('Please set a proper secret in your backend/.env file for production environments.');
        logger.warn('**********************************************************************************');
    }
}

export const sessionParser = session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
    }
});

app.use(sessionParser);

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

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
