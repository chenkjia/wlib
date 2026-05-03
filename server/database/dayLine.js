import logger from '~/utils/logger.js';
import { Stock } from './models/stock.js';
import { calculateForwardAdjusted } from '~/utils/chartUtils.js';

/**
 * 日线数据数据库操作类
 */
class DayLineDB {
    /**
     * 获取单个股票的最后一条日线数据
     * @param {string} code - 股票代码
     * @returns {Promise<Object>} 最后一条日线数据
     */
    static async getLastDayLine(code) {
        try {
            const result = await Stock.findOne(
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
     * 获取单个股票的第一条日线数据
     * @param {string} code - 股票代码
     * @returns {Promise<Object>} 第一条日线数据
     */
    static async getFirstDayLine(code) {
        try {
            const result = await Stock.findOne(
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

    /**
     * 获取日线数据
     * @param {string} code - 股票代码
     * @param {Date} startTime - 开始时间
     * @param {Date} endTime - 结束时间
     * @returns {Promise<Array>} 日线数据
     */
    static async getDayLine(code, startTime = null, endTime = null) {
        try {
            const stock = await Stock.findOne(
                { code },
                { _id: 0, dayLine: 1, adjustFactor: 1 }
            ).lean();
            if (!stock) throw new Error(`股票代码 ${code} 不存在`);

            let dayLineData = Array.isArray(stock.dayLine) ? stock.dayLine : [];
            if (startTime || endTime) {
                const startTs = startTime ? new Date(startTime).getTime() : -Infinity;
                const endTs = endTime ? new Date(endTime).getTime() : Infinity;
                dayLineData = dayLineData.filter((item) => {
                    const ts = new Date(item?.time).getTime();
                    return Number.isFinite(ts) && ts >= startTs && ts <= endTs;
                });
            }
            const adjustFactorData = Array.isArray(stock.adjustFactor) ? stock.adjustFactor : [];
            return calculateForwardAdjusted(dayLineData, adjustFactorData);
        } catch (error) {
            logger.error('获取日线数据失败:', error);
            throw error;
        }
    }

    /**
     * 保存日线数据，如果数据已存在（根据time判断）则更新，否则插入新数据
     * @param {string} code - 股票代码
     * @param {Array} data - 日线数据
     * @returns {Promise} 保存结果
     */
    static async saveDayLine(code, data) {
        try {
            // First, remove any existing entries with matching times
            await Stock.updateOne(
                { code },
                { $pull: { dayLine: { time: { $in: data.map(item => item.time) } } } }
            );

            // Then add the new data
            const result = await Stock.updateOne(
                { code },
                { $push: { dayLine: { $each: data } } },
                { upsert: true }
            );
            return result;
        } catch (error) {
            logger.error('保存日线数据失败:', error);
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
            const result = await Stock.updateOne(
                { code },
                { $set: { dayLine: [] } }
            );
            return result;
        } catch (error) {
            logger.error('清空日线数据失败:', error);
            throw error;
        }
    }
}

export default DayLineDB;
