const winston = require('winston');

const colors = {
    error: '\x1b[31m', // red
    warn: '\x1b[33m', // yellow
    info: '\x1b[32m', // green
    debug: '\x1b[36m', // cyan
    verbose: '\x1b[35m', // magenta
};

function customLogger(level, message) {
    const color = colors[level] || '\x1b[0m';
    const logMessage = `${color}[${level.toUpperCase()}]: ${message}\x1b[0m`;

    return logMessage;
}

const logger = winston.createLogger({
    level: 'debug',
    transports: [
        new winston.transports.Console({

            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf((info) => {
                    return customLogger(info.level, `[${info.timestamp}] ${info.message}`);
                })
            ),

        }),
    ],
});

module.exports = { logger };
