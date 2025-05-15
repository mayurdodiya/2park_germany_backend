const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf } = format;
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logsDir = path.join(__dirname , '../dahua_logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create a logger function for dynamic files
const getLogger = (apiName) => {
    return createLogger({
        level: 'info',
        format: combine(
            timestamp(),
            printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
        ),
        transports: [
            new transports.File({ filename: path.join(logsDir, `${apiName}.log`) })
        ]
    });
};

module.exports = { getLogger };
