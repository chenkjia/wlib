import logger from '../utils/logger.js';
import { Stock } from './models/stock.js';

/**
 * 股票列表数据库操作类
 */
class StockDB {
    /**
     * 获取股票列表（不包含历史数据）
     * @param {number} page - 页码，从1开始
     * @param {number} pageSize - 每页数量
     * @returns {Promise<Object>} 包含股票列表和总数的对象
     */
    static async getList(page = 1, pageSize = 20) {
        try {
            // 计算跳过的文档数量
            const skip = (page - 1) * pageSize;
            
            // 查询总数
            const total = await Stock.countDocuments({});
            
            // 计算总页数
            const totalPages = Math.ceil(total / pageSize);
            
            // 查询当前页的数据
            const stocks = await Stock.find({}, {
                code: 1,
                name: 1
            })
            .sort({ code: 1 }) // 按股票代码排序
            .skip(skip)
            .limit(pageSize);
            
            return {
                stocks,
                total,
                page,
                pageSize,
                totalPages
            };
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
            const stock = await Stock.findOne({ code });
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
        console.log('saveList')
        console.log(data)
        console.log('saveList')
        try {
            const result = await Stock.insertMany(data, { ordered: false });
            return result;
        } catch (error) {
            logger.error('保存股票列表失败:', error);
            throw error;
        }
    }
}

export default StockDB;