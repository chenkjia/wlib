import logger from '../utils/logger.js';
import { StockList } from './models/list.js';

/**
 * 小时线数据数据库操作类
 */
class HourLineDB {
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
            await StockList.updateOne(
                { code },
                { $pull: { hourLine: { time: { $in: data.map(item => item.time) } } } }
            );

            const result = await StockList.updateOne(
                { code },
                { $push: { hourLine: { $each: data } } },
                { upsert: true }
            );
            return result;
        } catch (error) {
            logger.error('保存小时线数据失败:', error);
            throw error;
        }
    }

    /**
     * 获取小时线数据
     * @param {string} code - 股票代码
     * @param {Date} startTime - 开始时间
     * @param {Date} endTime - 结束时间
     * @returns {Promise<Array>} 小时线数据
     */
    static async getHourLine(code, startTime = null, endTime = null) {
        try {
            const query = { code };
            const projection = { _id: 0 };

            if (startTime && endTime) {
                query['hourLine'] = {
                    $elemMatch: {
                        time: { $gte: startTime, $lte: endTime }
                    }
                };
                projection['hourLine.$'] = 1;
            } else {
                projection['hourLine'] = 1;
            }

            const stock = await StockList.findOne(query, projection);
            if (!stock) {
                throw new Error(`股票代码 ${code} 不存在`);
            }
            
            return stock.hourLine || [];
        } catch (error) {
            logger.error('获取小时线数据失败:', error);
            throw error;
        }
    }

    /**
     * 清空小时线数据
     * @param {string} code - 股票代码
     * @returns {Promise} 清空结果
     */
    static async clearHourLine(code) {
        try {
            const result = await StockList.updateOne(
                { code },
                { $set: { hourLine: [] } }
            );
            return result;
        } catch (error) {
            logger.error('清空小时线数据失败:', error);
            throw error;
        }
    }
}

export default HourLineDB;