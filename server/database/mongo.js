import mongoose from 'mongoose';
import config from '../config/default.js';
import logger from '../utils/logger.js';
import { StockList } from './models/list.js';

/**
 * MongoDB 数据库连接和基础操作类
 */
class MongoDB {
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

    /**
     * 获取股票列表（不包含历史数据）
     * @returns {Promise<Array>} 股票列表基本数据
     */
    static async getList() {
        try {
            const list = await StockList.find({}, {
                dayLine: 0,
                dayMetric: 0,
                signal: 0
            });
            return list;
        } catch (error) {
            logger.error('获取股票列表失败:', error);
            throw error;
        }
    }

    /**
     * 获取单个股票的完整信息
     * @param {string} code - 股票代码
     * @returns {Promise<Object>} 股票完整信息
     */
    static async getStock(code) {
        try {
            const stock = await StockList.findOne({ code });
            if (!stock) {
                throw new Error(`股票代码 ${code} 不存在`);
            }
            return stock;
        } catch (error) {
            logger.error('获取股票信息失败:', error);
            throw error;
        }
    }

    /**
     * 获取单个股票的最后一条日线数据
     * @param {string} code - 股票代码
     * @returns {Promise<Object>} 最后一条日线数据
     */
    static async getLastDayLine(code) {
        try {
            const result = await StockList.findOne(
                { code },
                { dayLine: { $slice: -1 } }
            );
            
            if (!result) {
                throw new Error(`股票代码 ${code} 不存在`);
            }

            return result.dayLine[0] || null;
        } catch (error) {
            logger.error('获取最后一条日线数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取日线数据
     * @param {string} code - 股票代码
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {Promise<Array>} 日线数据
     */
    static async getDayLine(code, startDate = null, endDate = null) {
        try {
            const stock = await StockList.findOne({ code });
            if (!stock) {
                throw new Error(`股票代码 ${code} 不存在`);
            }
            
            if (startDate && endDate) {
                return stock.dayLine.filter(day => 
                    day.date >= startDate && day.date <= endDate
                );
            }
            
            return stock.dayLine;
        } catch (error) {
            logger.error('获取日线数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取技术指标数据
     * @param {string} code - 股票代码
     * @param {string} startDate - 开始日期
     * @param {string} endDate - 结束日期
     * @returns {Promise<Array>} 指标数据
     */
    static async getMetric(code, startDate = null, endDate = null) {
        try {
            const stock = await StockList.findOne({ code });
            if (!stock) {
                throw new Error(`股票代码 ${code} 不存在`);
            }
            
            if (startDate && endDate) {
                return stock.dayMetric.filter(metric =>
                    metric.date >= startDate && metric.date <= endDate
                );
            }
            
            return stock.dayMetric;
        } catch (error) {
            logger.error('获取技术指标数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取交易信号
     * @param {string} code - 股票代码
     * @returns {Promise<Array>} 交易信号数据
     */
    static async getSignal(code) {
        try {
            const stock = await StockList.findOne({ code });
            if (!stock) {
                throw new Error(`股票代码 ${code} 不存在`);
            }
            
            return stock.signal;
        } catch (error) {
            logger.error('获取交易信号失败:', error);
            throw error;
        }
    }

    /**
     * 保存股票列表
     * @param {Array} data - 股票列表数据
     * @returns {Promise} 保存结果
     */
    static async saveList(data) {
        try {
            const result = await StockList.insertMany(data, { ordered: false });
            return result;
        } catch (error) {
            logger.error('保存股票列表失败:', error);
            throw error;
        }
    }

    /**
     * 保存日线数据
     * @param {string} code - 股票代码
     * @param {Array} data - 日线数据
     * @returns {Promise} 保存结果
     */
    static async saveDayLine(code, data) {
        try {
            const result = await StockList.updateOne(
                { code },
                { $push: { dayLine: { $each: data } } }
            );
            return result;
        } catch (error) {
            logger.error('保存日线数据失败:', error);
            throw error;
        }
    }

    /**
     * 保存技术指标数据
     * @param {string} code - 股票代码
     * @param {Array} data - 指标数据
     * @returns {Promise} 保存结果
     */
    static async saveMetric(code, data) {
        try {
            const result = await StockList.updateOne(
                { code },
                { $push: { dayMetric: { $each: data } } }
            );
            return result;
        } catch (error) {
            logger.error('保存技术指标数据失败:', error);
            throw error;
        }
    }

    /**
     * 保存交易信号
     * @param {string} code - 股票代码
     * @param {Array} data - 信号数据
     * @returns {Promise} 保存结果
     */
    static async saveSignal(code, data) {
        try {
            const result = await StockList.updateOne(
                { code },
                { $push: { signal: { $each: data } } }
            );
            return result;
        } catch (error) {
            logger.error('保存交易信号失败:', error);
            throw error;
        }
    }

    /**
     * 清空日线数据
     * @param {string} code - 股票代码
     * @returns {Promise} 清空结果
     */
    static async clearDayLine(code) {
        try {
            const result = await StockList.updateOne(
                { code },
                { $set: { dayLine: [] } }
            );
            return result;
        } catch (error) {
            logger.error('清空日线数据失败:', error);
            throw error;
        }
    }

    /**
     * 清空技术指标数据
     * @param {string} code - 股票代码
     * @returns {Promise} 清空结果
     */
    static async clearMetric(code) {
        try {
            const result = await StockList.updateOne(
                { code },
                { $set: { dayMetric: [] } }
            );
            return result;
        } catch (error) {
            logger.error('清空技术指标数据失败:', error);
            throw error;
        }
    }

    /**
     * 清空交易信号数据
     * @param {string} code - 股票代码
     * @returns {Promise} 清空结果
     */
    static async clearSignal(code) {
        try {
            const result = await StockList.updateOne(
                { code },
                { $set: { signal: [] } }
            );
            return result;
        } catch (error) {
            logger.error('清空交易信号数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取单个股票的最后一条小时线数据
     * @param {string} code - 股票代码
     * @returns {Promise<Object>} 最后一条小时线数据
     */
    static async getLastHourLine(code) {
        try {
            const result = await StockList.findOne(
                { code },
                { hourLine: { $slice: -1 } }
            );
            
            if (!result) {
                throw new Error(`股票代码 ${code} 不存在`);
            }

            return result.hourLine[0] || null;
        } catch (error) {
            logger.error('获取最后一条小时线数据失败:', error);
            throw error;
        }
    }

    /**
     * 保存小时线数据
     * @param {string} code - 股票代码
     * @param {Array} data - 小时线数据
     * @returns {Promise} 保存结果
     */
    static async saveHourLine(code, data) {
        try {
            const BATCH_SIZE = 50000;
            
            if (data.length <= BATCH_SIZE) {
                // 如果数据量小于等于50000，直接插入
                const result = await StockList.updateOne(
                    { code },
                    { $push: { hourLine: { $each: data } } }
                );
                return result;
            } else {
                // 如果数据量大于50000，分批插入
                const batches = Math.ceil(data.length / BATCH_SIZE);
                let lastResult;
                
                for (let i = 0; i < batches; i++) {
                    const start = i * BATCH_SIZE;
                    const end = Math.min((i + 1) * BATCH_SIZE, data.length);
                    const batchData = data.slice(start, end);
                    
                    lastResult = await StockList.updateOne(
                        { code },
                        { $push: { hourLine: { $each: batchData } } }
                    );
                    
                    logger.info(`已完成第 ${i + 1}/${batches} 批数据插入，本批数据量: ${batchData.length}`);
                }
                
                return lastResult;
            }
        } catch (error) {
            logger.error('保存小时线数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取单个股票的第一条日线数据
     * @param {string} code - 股票代码
     * @returns {Promise<Object>} 第一条日线数据
     */
    static async getFirstDayLine(code) {
        try {
            const result = await StockList.findOne(
                { code },
                { dayLine: { $slice: 1 } }
            );
            
            if (!result) {
                throw new Error(`股票代码 ${code} 不存在`);
            }

            return result.dayLine[0] || null;
        } catch (error) {
            logger.error('获取第一条日线数据失败:', error);
            throw error;
        }
    }
}

export default MongoDB;