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
     * @param {string} search - 搜索关键词
     * @returns {Promise<Object>} 包含股票列表和总数的对象
     */
    static async getList(page = 1, pageSize = 20, search = '') {
        try {
            // 计算跳过的文档数量
            const skip = (page - 1) * pageSize;
            
            // 构建查询条件，区分大小写的搜索
            let query = { };
            if (search) {
                query = { code: search };
            }
            
            // 使用Promise.all并行执行查询总数和查询数据，提高性能
            const [total, stocks] = await Promise.all([
                // 查询总数 - 使用查询条件
                Stock.countDocuments(query).hint({ code: 1 }),
                
                // 查询当前页的数据 - 明确指定只获取需要的字段
                Stock.find(query, {
                    _id: 0, // 不返回_id字段
                    code: 1,
                    name: 1
                })
                .hint({ code: 1 }) // 明确使用code索引
                .sort({ code: 1 }) // 按股票代码排序
                .skip(skip)
                .limit(pageSize)
                .lean() // 返回纯JavaScript对象，而不是Mongoose文档，提高性能
            ]);
            
            // 计算总页数
            const totalPages = Math.ceil(total / pageSize);
            
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