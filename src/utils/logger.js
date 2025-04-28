let winston = require("winston");

let logger = winston.createLogger({
    level: "info",
    transports: [
        new winston.transports.Console()
    ],
});


module.exports = logger;