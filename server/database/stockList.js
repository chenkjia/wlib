import logger from '../utils/logger.js';
import { StockList } from './models/list.js';

/**
 * 股票列表数据库操作类
 */
class StockListDB {
    /**
     * 获取股票列表（不包含历史数据）
     * @returns {Promise<Array>} 股票列表基本数据
     */
    static async getList() {
        try {
            const list = await StockList.find({}, {
                code: 1,
                name: 1
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
}

export default StockListDB;