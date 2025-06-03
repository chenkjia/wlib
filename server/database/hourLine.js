import logger from '../utils/logger.js';
import { Stock } from './models/stock.js';

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
            const result = await Stock.findOne(
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
            await Stock.updateOne(
                { code },
                { $pull: { hourLine: { time: { $in: data.map(item => item.time) } } } }
            );

            const result = await Stock.updateOne(
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
            if (startTime && endTime) {
                // 确保类型为Date
                const start = new Date(startTime)
                const end = new Date(endTime)
                const result = await Stock.aggregate([{
                    $match: {code}
                  },
                  {
                    $project: {  // 重组字段
                      hourLine: 1,
                    }
                  },
                  {
                    $unwind: "$hourLine"  // 先展开数组
                  },
                  {
                    $match: {  // 过滤时间范围
                      "hourLine.time": {
                        $gte: new Date(startTime),
                        $lte: new Date(endTime)
                      }
                    }
                  }
                
                ])
                
                return result.map(item => item.hourLine) || [];
            } else {
                // 没有时间区间就返回全部
                const stock = await Stock.findOne({ code }, { _id: 0, hourLine: 1 });
                if (!stock) throw new Error(`股票代码 ${code} 不存在`);
                return stock.hourLine || [];
            }
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
            const result = await Stock.updateOne(
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