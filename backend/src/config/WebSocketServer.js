import { WebSocketServer } from 'ws';
import logger from '../helpers/logger.js';

const clients = new Map(); // Map<userId, WebSocket>

// This module will be initialized once, so wss will be a singleton instance within this scope.
let wss; 

export const initializeWebSocketServer = (server, sessionParser) => {
    wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        // Use the session parser to get session data from the request
        sessionParser(request, {}, () => {
            const userId = request.session?.passport?.user;
            if (!userId) {
                logger.warn('WebSocket connection attempt without authentication. Destroying socket.');
                socket.destroy();
                return;
            }

            // If authenticated, proceed with the WebSocket upgrade
            wss.handleUpgrade(request, socket, head, (ws) => {
                // Pass the authenticated user ID to the connection event
                wss.emit('connection', ws, request, userId);
            });
        });
    });

    wss.on('connection', (ws, request, userId) => {
        clients.set(userId, ws);
        logger.info(`WebSocket client connected: user ${userId}`);

        ws.on('close', () => {
            clients.delete(userId);
            logger.info(`WebSocket client disconnected: user ${userId}`);
        });

        ws.on('error', (error) => {
            logger.error(`WebSocket error for user ${userId}:`, error);
        });
    });
};

export const sendToUser = (userId, data) => {
    const client = clients.get(userId);
    if (client && client.readyState === client.OPEN) {
        client.send(JSON.stringify(data));
        logger.info(`Sent WebSocket message to user ${userId}`);
    } else {
        logger.warn(`Could not send WebSocket message to user ${userId}: client not found or not open.`);
    }
};
