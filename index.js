require("dotenv").config();
let express = require('express');
const http = require('http');
let path = require('path');
let helmet = require("helmet");
let logger = require('morgan');
let cors = require('cors');
let general_config = require("./src/config/general.config");
let fs = require('fs');
let index = require('./src/routes/index.route');
const webSocketUtils = require('./src/utils/webSocket');

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

// Initialize WebSocket server
const wss = webSocketUtils.initializeWebSocketServer(server);

// // Set up routes
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
});

module.exports = server;