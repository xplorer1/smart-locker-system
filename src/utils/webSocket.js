const WebSocket = require('ws');

// Track WebSocket clients with their IDs
const connectedClients = new Map();

// List of allowed client types
const allowedClients = ["MASTER", "RFID"];

/**
 * Initialize WebSocket server
 * @param {Object} server - HTTP server instance
 * @returns {Object} WebSocket server instance
 */
function initializeWebSocketServer(server) {
    // Create WebSocket server attached directly to the HTTP server
    const wss = new WebSocket.Server({
        server: server,
        path: "/ws" // Explicitly set the path
    });

    // WebSocket connection handler
    wss.on('connection', (ws, req) => {
        // Handle messages from client
        ws.on('message', (data) => {
            try {
                console.log('Raw data received:', data.toString());

                // Parse the incoming JSON message
                const jsonMessage = JSON.parse(data);
                console.log('Received JSON message:', jsonMessage);

                // Process message based on type
                if (jsonMessage.type === 'info' && allowedClients.includes(jsonMessage.from?.toUpperCase())) {
                    const ip = req.socket.remoteAddress;
                    connectedClients.set(jsonMessage.from, {
                        ws: ws,
                        ip: ip,
                        connectedAt: new Date(),
                        id: jsonMessage.from
                    });
                }
            } catch (error) {
                console.error('Error processing message:', error);
                // Send error message back to client
                ws.send(JSON.stringify({
                    type: "error",
                    message: "Error processing message",
                    error: error.message
                }));
            }
        });

        // Handle client disconnection
        ws.on('close', () => {
            // Find and remove the disconnected client
            for (let [id, client] of connectedClients.entries()) {
                if (client.ws === ws) {
                    console.log(`Client ${id} disconnected`);
                    connectedClients.delete(id);
                    break;
                }
            }
        });

        // Handle errors
        ws.on('error', (error) => {
            console.error(`WebSocket error:`, error);
        });
    });

    console.log(`WebSocket server initialized on path: /ws`);
    return wss;
}

/**
 * Generate unique client ID
 * @returns {string} Unique client ID
 */
function generateClientId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

/**
 * Send message to a specific client
 * @param {string} clientId - Client identifier
 * @param {Object} message - Message to send
 * @returns {boolean} Success status
 */
function sendToClient(clientId, message) {
    const client = connectedClients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
        return true;
    }
    return false;
}

/**
 * Broadcast message to all connected clients
 * @param {Object} message - Message to broadcast
 */
function broadcastMessage(message) {
    connectedClients.forEach((client, id) => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    });
}

module.exports = {
    initializeWebSocketServer,
    generateClientId,
    sendToClient,
    broadcastMessage,
    connectedClients
};
