import { WebSocketServer } from 'ws';
import logger from '../helpers/logger.js';

// Map<userId, { ws: WebSocket, viewing: { projectId: string, branchName: string } | null }>
const clients = new Map(); 

let wss; 

export const initializeWebSocketServer = (server, sessionParser) => {
    wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
        sessionParser(request, {}, () => {
            const userId = request.session?.passport?.user;
            if (!userId) {
                logger.warn('WebSocket connection attempt without authentication. Destroying socket.');
                socket.destroy();
                return;
            }
            wss.handleUpgrade(request, socket, head, (ws) => {
                wss.emit('connection', ws, request, userId);
            });
        });
    });

    wss.on('connection', (ws, request, userId) => {
        clients.set(userId, { ws, viewing: null });
        logger.info(`WebSocket client connected: user ${userId}`);

        ws.on('message', (message) => {
            try {
                const data = JSON.parse(message);
                const clientState = clients.get(userId);
                
                switch (data.type) {
                    case 'client_viewing_branch':
                        if (clientState) {
                            clientState.viewing = data.payload;
                            logger.info(`User ${userId} is now viewing branch: ${data.payload.branchName}`);
                        }
                        break;
                    
                    case 'client_stopped_viewing':
                         if (clientState) {
                            clientState.viewing = null;
                         }
                         break;

                    case 'client_typing_start':
                        broadcastTypingEvent(userId, data.payload, true);
                        break;
                        
                    case 'client_typing_stop':
                        broadcastTypingEvent(userId, data.payload, false);
                        break;
                }
            } catch (error) {
                logger.error(`Error processing WebSocket message from user ${userId}:`, error);
            }
        });

        ws.on('close', () => {
            const clientState = clients.get(userId);
            // If the user was viewing a branch, notify others they stopped typing
            if (clientState?.viewing) {
                 broadcastTypingEvent(userId, { 
                    ...clientState.viewing, 
                    termId: null, // termId is not known on disconnect, but not needed for 'stop'
                    userName: ''   // userName is not known, but not needed for 'stop'
                }, false);
            }
            clients.delete(userId);
            logger.info(`WebSocket client disconnected: user ${userId}`);
        });

        ws.on('error', (error) => {
            logger.error(`WebSocket error for user ${userId}:`, error);
        });
    });
};

const broadcastTypingEvent = (typingUserId, payload, isTyping) => {
    const messageType = isTyping ? 'server_user_typing_start' : 'server_user_typing_stop';
    
    const message = JSON.stringify({
        type: messageType,
        userId: typingUserId,
        userName: payload.userName,
        termId: payload.termId
    });

    for (const [userId, client] of clients.entries()) {
        // Broadcast to other users viewing the same branch
        if (userId !== typingUserId && client.viewing?.projectId === payload.projectId && client.viewing?.branchName === payload.branchName) {
            if (client.ws.readyState === client.ws.OPEN) {
                client.ws.send(message);
            }
        }
    }
};

export const broadcastBranchUpdate = (projectId, branchName, modifiedByUserId) => {
    const message = JSON.stringify({
        type: 'server_branch_updated',
        projectId,
        branchName,
        modifiedBy: modifiedByUserId,
    });

    for (const [userId, client] of clients.entries()) {
        // Send to everyone viewing the branch. The client-side will prevent a self-refresh.
        if (client.viewing?.projectId === projectId && client.viewing?.branchName === branchName) {
             if (client.ws.readyState === client.ws.OPEN) {
                client.ws.send(message);
                logger.info(`Broadcasting branch update for ${branchName} to user ${userId}`);
            }
        }
    }
};

export const broadcastCommentUpdate = (projectId, branchName, termId, authorId) => {
    const message = JSON.stringify({
        type: 'server_new_comment',
        projectId,
        branchName,
        termId,
        authorId,
    });

    for (const [userId, client] of clients.entries()) {
        // Broadcast to other users on the same branch (client will filter by termId)
        if (userId !== authorId && client.viewing?.projectId === projectId && client.viewing?.branchName === branchName) {
            if (client.ws.readyState === client.ws.OPEN) {
                client.ws.send(message);
            }
        }
    }
};

export const sendToUser = (userId, data) => {
    const client = clients.get(userId)?.ws;
    if (client && client.readyState === client.OPEN) {
        client.send(JSON.stringify(data));
        logger.info(`Sent WebSocket message to user ${userId}`);
    } else {
        logger.warn(`Could not send WebSocket message to user ${userId}: client not found or not open.`);
    }
};