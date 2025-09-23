
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import SequelizeStore from 'connect-session-sequelize';
import sequelize from './src/database/Sequelize.js';
import apiRouter from './src/routes/index.js';
import logger from './src/helpers/logger.js';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerOptions from './swaggerConfig.js';
import './src/config/passport.js'; // This configures the Passport strategies
import { URL } from 'url'; // Import URL for parsing

const app = express();
const swaggerSpec = swaggerJSDoc(swaggerOptions);

// If running behind a proxy (like in production), trust the first hop
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1); // trust first proxy
}

// Middleware
// Allow cross-origin requests, especially for credentials (cookies)
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: (origin, callback) => {
    // This allows requests from any origin. For a production environment,
    // it would be more secure to maintain a whitelist of allowed origins.
    callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Explicitly allow common methods for pre-flight
  allowedHeaders: [ // Explicitly allow headers used by the app for pre-flight
    'Content-Type',
    'Authorization',
    'X-User-ID',
    'X-Api-Key-Prefix',
    'access-control-allow-methods',
    'access-control-allow-origin',
    'access-control-allow-headers'
  ],
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

// Helper to determine the root domain for sharing cookies across subdomains
const getRootDomain = (urlString) => {
    try {
        const hostname = new URL(urlString).hostname;
        // Don't set a domain for localhost to avoid browser issues
        if (hostname === 'localhost') {
            return undefined;
        }
        const parts = hostname.split('.');
        // Handles domains like 'example.com' or 'sub.example.co.uk'
        if (parts.length >= 2) {
            // Return the last two parts, prefixed with a dot. e.g., '.example.com'
            return '.' + parts.slice(-2).join('.');
        }
        return hostname; // Fallback for simple hostnames
    } catch (e) {
        logger.error(`Could not parse FRONTEND_URL to determine cookie domain: ${urlString}`, e);
        return undefined;
    }
};

// Determine the cookie domain only in production
const cookieDomain = process.env.NODE_ENV === 'production' ? getRootDomain(frontendUrl) : undefined;
if (process.env.NODE_ENV === 'production' && cookieDomain) {
    logger.info(`Session cookies will be scoped to domain: ${cookieDomain}`);
}


// Initialize session store backed by Sequelize
const SessionStore = SequelizeStore(session.Store);
const sessionStore = new SessionStore({
  db: sequelize,
});

export const sessionParser = session({
    secret: sessionSecret,
    store: sessionStore,
    resave: false,
    saveUninitialized: false, // Don't create session until something stored
    cookie: {
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        httpOnly: true,
        // Set a maxAge for the cookie to make it persistent.
        // This keeps the user logged in across page reloads and browser sessions.
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        // Explicitly set SameSite for cross-origin session persistence
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        // Set the domain to allow cookies to be shared across subdomains in production
        domain: cookieDomain,
    }
});
// Create the sessions table if it doesn't exist
sessionStore.sync();

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
  // Custom usage limit error
  if (err.name === 'UsageLimitError') {
      logger.warn(`UsageLimitError for ${req.user?.id ? `user ${req.user.id}` : `IP ${req.ip}`}: ${err.message}`);
      return res.status(err.status || 403).json({ message: err.message });
  }

  // Log other errors
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack);

  // Send generic response for server errors
  res.status(500).json({ message: 'Internal Server Error' });
});

export default app;
