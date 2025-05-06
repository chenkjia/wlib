import winston from 'winston';
import config from '../config/default.js';

const logger = winston.createLogger({
    level: config.logger.level,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: config.logger.filename }),
        new winston.transports.Console()
    ]
});

export default logger;