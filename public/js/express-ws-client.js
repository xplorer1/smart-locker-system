/**
 * Client-side utility for connecting to the Express-WS WebSocket server
 */
class WebSocketClient {
    constructor(url = `ws://${window.location.host}/ws`) {
        this.url = url;
        this.socket = null;
        this.clientId = null;
        this.connected = false;
        this.eventHandlers = {};
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 3000;
    }

    /**
     * Connect to the WebSocket server
     * @param {Object} options - Connection options
     * @returns {Promise} Promise that resolves when connected
     */
    connect(options = {}) {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(this.url);
                
                this.socket.onopen = () => {
                    console.log('Connected to WebSocket server');
                    this.connected = true;
                    this.reconnectAttempts = 0;
                    
                    // Wait for server to assign client ID before resolving
                    this.once('connection', (data) => {
                        this.clientId = data.clientId;
                        console.log(`Assigned client ID: ${this.clientId}`);
                        
                        // Identify this client if user information is provided
                        if (options.userId || options.clientType) {
                            this.identify(options.userId, options.clientType);
                        }
                        
                        resolve(this.socket);
                    });
                };
                
                this.socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.handleMessage(message);
                    } catch (error) {
                        console.error('Error parsing message:', error);
                    }
                };
                
                this.socket.onclose = (event) => {
                    console.log('WebSocket connection closed:', event.code, event.reason);
                    this.connected = false;
                    
                    // Attempt to reconnect
                    if (this.reconnectAttempts < this.maxReconnectAttempts) {
                        console.log(`Attempting to reconnect in ${this.reconnectDelay}ms...`);
                        this.reconnectAttempts++;
                        setTimeout(() => this.connect(options), this.reconnectDelay);
                    }
                };
                
                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    reject(error);
                };
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                reject(error);
            }
        });
    }
    
    /**
     * Handle incoming WebSocket messages
     * @param {Object} message - The parsed message
     */
    handleMessage(message) {
        switch (message.type) {
            case 'connection':
                this.triggerEvent('connection', message);
                break;
                
            case 'identified':
            case 'joined':
            case 'left':
                // Handle room management events
                this.triggerEvent(message.type, message);
                break;
                
            case 'event':
                // Handle custom events from server
                if (message.event) {
                    this.triggerEvent(message.event, message.data);
                }
                break;
                
            case 'error':
                console.error('Server error:', message.message);
                this.triggerEvent('error', message);
                break;
                
            default:
                console.log('Unknown message type:', message);
                break;
        }
    }
    
    /**
     * Trigger event handlers for a specific event
     * @param {String} event - Event name
     * @param {Object} data - Event data
     */
    triggerEvent(event, data) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event].forEach(handler => {
                try {
                    handler(data);
                } catch (error) {
                    console.error(`Error in handler for event '${event}':`, error);
                }
            });
        }
    }
    
    /**
     * Listen for an event only once
     * @param {String} event - Event name
     * @param {Function} handler - Event handler
     */
    once(event, handler) {
        const onceHandler = (data) => {
            this.off(event, onceHandler);
            handler(data);
        };
        
        this.on(event, onceHandler);
    }
    
    /**
     * Listen for an event
     * @param {String} event - Event name
     * @param {Function} handler - Event handler
     */
    on(event, handler) {
        if (!this.eventHandlers[event]) {
            this.eventHandlers[event] = [];
        }
        this.eventHandlers[event].push(handler);
    }
    
    /**
     * Remove an event listener
     * @param {String} event - Event name
     * @param {Function} handler - Event handler to remove
     */
    off(event, handler) {
        if (this.eventHandlers[event]) {
            this.eventHandlers[event] = this.eventHandlers[event].filter(h => h !== handler);
        }
    }
    
    /**
     * Identify this client to the server
     * @param {String} userId - Optional user ID
     * @param {String} clientType - Client type (user, admin, device)
     */
    identify(userId, clientType = 'user') {
        this.send({
            type: 'identify',
            userId,
            clientType
        });
    }
    
    /**
     * Join a room
     * @param {String} room - Room name
     */
    joinRoom(room) {
        this.send({
            type: 'join',
            room
        });
    }
    
    /**
     * Leave a room
     * @param {String} room - Room name
     */
    leaveRoom(room) {
        this.send({
            type: 'leave',
            room
        });
    }
    
    /**
     * Send a custom event to the server
     * @param {String} event - Event name
     * @param {Object} data - Event data
     */
    emit(event, data) {
        this.send({
            type: 'message',
            event,
            data
        });
    }
    
    /**
     * Send a message to the server
     * @param {Object} message - Message to send
     */
    send(message) {
        if (!this.connected || !this.socket) {
            console.warn('Cannot send message: not connected to WebSocket server');
            return false;
        }
        
        try {
            this.socket.send(JSON.stringify(message));
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }
    
    /**
     * Disconnect from the WebSocket server
     */
    disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
            this.connected = false;
            this.clientId = null;
        }
    }
}

// Create a global instance if in browser environment
if (typeof window !== 'undefined') {
    window.wsClient = new WebSocketClient();
}
