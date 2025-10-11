import mongoose from 'mongoose';
import config from '../config/default.js';
import logger from '~/utils/logger.js';

// 全局数据源变量
let currentDataSource = 'alib';

/**
 * MongoDB 数据库连接类
 */
class MongoConnection {
    static isConnected = false;

    /**
     * 设置当前数据源
     * @param {string} dataSource - 数据源标识 ('flib' 或 'alib')
     */
    static async setDataSource(dataSource = 'alib') {
        if (!['flib', 'alib'].includes(dataSource)) {
            throw new Error(`Invalid dataSource: ${dataSource}. Must be 'flib' or 'alib'`);
        }
        currentDataSource = dataSource;
        logger.info(`Data source set to: ${dataSource}`);
    }
    
    /**
     * 连接数据库
     * @returns {Promise} 连接成功的Promise
     */
    static async connect() {
        console.log('connect', currentDataSource)
        const targetUri = config.mongodb.uri[currentDataSource]
        console.log('targetUri', targetUri)
        try {
            // 如果连接到不同的数据库，先断开
            if (mongoose.connection.readyState === 1 && 
                mongoose.connection._connectionString !== targetUri) {
                await this.disconnect();
            }
            // 建立新连接
            await mongoose.connect(targetUri, config.mongodb.options);
            this.isConnected = true;
            logger.info(`MongoDB connected successfully to ${currentDataSource} database`);
        } catch (error) {
            this.isConnected = false;
            logger.error('MongoDB connection error:', error);
            throw error;
        }
    }
    
    /**
     * 断开数据库连接
     * @returns {Promise} 断开连接的Promise
     */
    static async disconnect() {
        try {
            if (mongoose.connection.readyState !== 0) { // 0 = disconnected
                await mongoose.connection.close();
                this.isConnected = false;
                logger.info('MongoDB disconnected successfully');
            }
            return Promise.resolve();
        } catch (error) {
            logger.error('MongoDB disconnection error:', error);
            throw error;
        }
    }
}

export default MongoConnection;