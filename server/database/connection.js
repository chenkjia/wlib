import mongoose from 'mongoose';
import config from '../config/default.js';
import logger from '../utils/logger.js';

/**
 * MongoDB 数据库连接类
 */
class MongoConnection {
    static isConnected = false;
    
    /**
     * 连接数据库
     * @returns {Promise} 连接成功的Promise
     */
    static async connect() {
        // 如果已经连接，则直接返回
        if (this.isConnected) {
            return Promise.resolve();
        }
        
        try {
            // 检查当前连接状态
            if (mongoose.connection.readyState === 1) {
                this.isConnected = true;
                return Promise.resolve();
            }
            
            // 建立新连接
            await mongoose.connect(config.mongodb.uri, config.mongodb.options);
            this.isConnected = true;
            logger.info('MongoDB connected successfully');
        } catch (error) {
            this.isConnected = false;
            logger.error('MongoDB connection error:', error);
            throw error;
        }
    }
}

export default MongoConnection;