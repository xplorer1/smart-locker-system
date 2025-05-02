require("dotenv").config();
let express = require('express');
const http = require('http');
let path = require('path');
let helmet = require("helmet");
const WebSocket = require('ws');
let logger = require('morgan');
let cors = require('cors');
let general_config = require("./src/config/general_config");
let fs = require('fs');

// Create Express app and HTTP server
let app = express();
let server = http.createServer(app);

// First, configure express middleware
app.use(cors());
app.use(
    helmet({
        contentSecurityPolicy: false,
    })
);

app.use(logger('dev'));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: false, limit: "5mb" }));

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS, DELETE');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Headers', 'x-access-token,X-Requested-With,Content-Type,Authorization,cache-control');

    //To handle timeout errors gracefully.
    res.setTimeout(29000, function () {
        return res.status(402).json({
            status: false,
            message: "Taking too long to respond. Please try again after some minutes."
        });
    });

    next();
});

let index = require('./src/routes/index.route');
// Track WebSocket clients with their IDs
const connectedClients = new Map();

// Create WebSocket server attached directly to the HTTP server
const wss = new WebSocket.Server({
    server: server,
    path: "/ws" // Explicitly set the path
});

// Generate unique client ID
function generateClientId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// Function to send message to a specific client
function sendToClient(clientId, message) {
    const client = connectedClients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
        return true;
    }
    return false;
}


const allowedClients = ["MASTER", "RFID"];

// WebSocket connection handler
wss.on('connection', (ws, req) => {

    // Store client with identifying information
    // connectedClients.set(clientId, {
    //     ws: ws,
    //     ip: ip,
    //     connectedAt: new Date(),
    //     id: clientId
    // });

    // console.log(`Client connected from ${ip} with ID: ${clientId}`);

    // // Send a welcome message with client ID
    // const welcomeMessage = {
    //     type: "welcome",
    //     message: "Welcome to the server",
    //     clientId: clientId,
    //     value: 100
    // };
    // ws.send(JSON.stringify(welcomeMessage));

    // Handle messages from client
    ws.on('message', (data) => {
        try {
            console.log('Raw data received:', data.toString());

            // Parse the incoming JSON message
            const jsonMessage = JSON.parse(data);
            console.log('Received JSON message:', jsonMessage);

            // Process message based on type
            if (jsonMessage.type === 'info' && allowedClients.includes(jsonMessage.from?.toUpperCase())) {
                // console.log(`Info from client ${clientId}: ${jsonMessage.message}`);
                const ip = req.socket.remoteAddress;
                // const clientId = generateClientId();
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
        console.log(`Client ${clientId} disconnected`);
        connectedClients.delete(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
    });
});

// Helper function to broadcast message to all clients
function broadcastMessage(message) {
    connectedClients.forEach((client, id) => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(JSON.stringify(message));
        }
    });
}

// Set up routes
let index = require('./src/routes/index');
app.use('/api', index);

app.get('/admin', (req, res) => {
    let file_path = path.join(__dirname, 'public', 'admin.html');
    fs.readFile(file_path, 'utf8', (err, html) => {
        if (err) return res.status(500).send('Error loading page');
        // replace the placeholder with the real env-var

        let out = html.replace(
            /__API_BASE_URL__/g,
            process.env.API_BASE_URL
        );
        res.type('html').send(out);
    });
});

app.get('/user', (req, res) => {
    let file_path = path.join(__dirname, 'public', 'user.html');
    fs.readFile(file_path, 'utf8', (err, html) => {
        if (err) return res.status(500).send('Error loading page');
        // replace the placeholder with the real env-var

        let out = html.replace(
            /__API_BASE_URL__/g,
            process.env.API_BASE_URL
        );
        res.type('html').send(out);
    });
});

// Simple route for testing WebSocket connection
app.get('/ws-test', (req, res) => {
    const host = req.headers.host;
    res.send(`WebSocket server is running. Connect to ws://${host}/ws`);
});

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    console.log(`404 Not Found: ${req.method} ${req.url}`);
    res.status(404).send({
        message: "Requested resource cannot be found at this location.",
        status: false,
        path: req.url
    });
});

// error handler
app.use(function (err, req, res, next) {
    console.error(`Error: ${err.message}`);
    console.error(err.stack);

    res.status(err.status || 500);
    res.send({
        error: err.message,
        status: false
    });
});

// Start the server
const port = general_config.port || 8070;
server.listen(port, () => {
    console.log(`HTTP Server listening on port ${port}!`);
    console.log(`WebSocket server initialized on path: /ws`);
});

module.exports = server;
module.exports = {
    sendToClient,
    broadcastMessage,
    connectedClients
};