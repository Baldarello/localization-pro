#!/usr/bin/env node
import 'dotenv/config'; // Load .env file
import app, { sessionParser } from '../app.js';
import http from 'http';
import logger from '../src/helpers/logger.js';
import sequelize from '../src/database/Sequelize.js';
import { initializeWebSocketServer } from '../src/config/WebSocketServer.js';
// This import is crucial: it registers all models with Sequelize before sync is called.
import '../src/database/models/index.js';

/**
 * Normalize a port into a number, string, or false.
 */
function normalizePort(val) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

const port = normalizePort(process.env.PORT || '3001');
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Event listener for HTTP server "error" event.
 */
function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      logger.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      logger.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */
function onListening() {
  const addr = server.address();
  const bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  logger.info('Backend server listening on ' + bind);
}

/**
 * Synchronize database and start server.
 */
async function startServer() {
  try {
    logger.info('Synchronizing database schemas...');
    // This command creates database tables if they don't exist,
    // based on the defined Sequelize models. It does not delete existing data.
    await sequelize.sync();
    logger.info('Database synchronized successfully.');

    // Initialize the WebSocket server and attach it to the HTTP server
    initializeWebSocketServer(server, sessionParser);

    /**
     * Listen on provided port, on all network interfaces.
     */
    server.listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
  } catch (error) {
    logger.error('Failed to start server due to database synchronization error:', error);
    process.exit(1);
  }
}

startServer();
