import logger from '~/utils/logger.js';
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
            // 先删除已存在的相同时间点的数据
            await Stock.updateOne(
                { code },
                { $pull: { hourLine: { time: { $in: data.map(item => item.time) } } } }
            );

            // 如果数据量超过20000条，分批处理
            const BATCH_SIZE = 20000;
            let result;
            
            if (data.length > BATCH_SIZE) {
                logger.info(`小时线数据量较大(${data.length}条)，开始分批存储...`);
                
                // 分批处理数据
                for (let i = 0; i < data.length; i += BATCH_SIZE) {
                    const batchData = data.slice(i, i + BATCH_SIZE);
                    logger.info(`正在存储第${Math.floor(i/BATCH_SIZE)+1}批数据，共${batchData.length}条`);
                    
                    result = await Stock.updateOne(
                        { code },
                        { $push: { hourLine: { $each: batchData } } },
                        { upsert: true }
                    );
                }
                
                logger.info(`分批存储完成，共${data.length}条数据`);
            } else {
                // 数据量较小，直接存储
                result = await Stock.updateOne(
                    { code },
                    { $push: { hourLine: { $each: data } } },
                    { upsert: true }
                );
            }
            
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