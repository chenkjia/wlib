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
}

export default HourLineDB;