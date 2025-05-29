import mongoose from 'mongoose';
import config from '../config/default.js';
import logger from '../utils/logger.js';

/**
 * MongoDB 数据库连接类
 */
class MongoConnection {
    /**
     * 连接数据库
     * @returns {Promise} 连接成功的Promise
     */
    static async connect() {
        try {
            await mongoose.connect(config.mongodb.uri, config.mongodb.options);
            logger.info('MongoDB connected successfully');
        } catch (error) {
            logger.error('MongoDB connection error:', error);
            throw error;
        }
    }
}

export default MongoConnection;