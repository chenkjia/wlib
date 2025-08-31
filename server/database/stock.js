import logger from '~/utils/logger.js';
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
    static async getList(page = 1, pageSize = 20, search = '', sortField = 'code', sortOrder = 'asc') {
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
                    name: 1,
                    isFocused: 1,
                    isHourFocused: 1
                })
                .sort({ [sortField]: sortOrder === 'asc' ? 1 : -1 }) // 动态排序
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
    static async removeStock(code) {
        try {
            const stock = await Stock.findOneAndRemove({ code });
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
     * 获取所有股票列表（不分页）
     * @param {string} search - 搜索关键词
     * @returns {Promise<Array>} 所有股票列表
     */
    static async getAll(search = '') {
        try {
            // 构建查询条件
            let query = {};
            if (search) {
                query = { code: search };
            }
            
            // 查询所有数据 - 只获取需要的字段
            const stocks = await Stock.find(query, {
                _id: 0, // 不返回_id字段
                code: 1,
                name: 1,
                isFocused: 1,
                isHourFocused: 1
            })
            .hint({ code: 1 }) // 使用code索引
            .sort({ code: 1 }) // 按股票代码排序
            .lean(); // 返回纯JavaScript对象，提高性能
            
            return stocks;
        } catch (error) {
            logger.error('获取所有股票列表失败:', error);
            throw error;
        }
    }

    /**
     * 获取重点关注的股票列表
     * @returns {Promise<Array>} 重点关注股票列表
     */
    static async getFocusedStocks() {
        try {
            const stocks = await Stock.find({ isFocused: true }, {
                _id: 0,
                code: 1,
                name: 1
            })
            .hint({ isFocused: 1 })
            .sort({ code: 1 })
            .lean();
            
            return stocks;
        } catch (error) {
            logger.error('获取重点关注股票列表失败:', error);
            throw error;
        }
    }

    /**
     * 更新所有股票的重点关注状态
     * @param {Array} focusedCodes - 重点关注的股票代码列表
     * @returns {Promise<Object>} 更新结果
     */
    static async updateAllFocusedStatus(focusedCodes = []) {
        try {
            // 先将所有股票设为非重点关注
            const resetResult = await Stock.updateMany(
                {},
                { $set: { isFocused: false } }
            );
            
            let focusedResult = { modifiedCount: 0 };
            // 如果有指定的重点关注股票代码，则将它们设为重点关注
            if (focusedCodes.length > 0) {
                focusedResult = await Stock.updateMany(
                    { code: { $in: focusedCodes } },
                    { $set: { isFocused: true } }
                );
            }
            
            return {
                resetCount: resetResult.modifiedCount,
                focusedCount: focusedResult.modifiedCount,
                totalFocusedCodes: focusedCodes.length
            };
        } catch (error) {
            logger.error('更新股票重点关注状态失败:', error);
            throw error;
        }
    }

    /**
     * 更新所有股票的小时线重点关注状态
     * @param {Array} hourFocusedCodes - 小时线重点关注的股票代码列表
     * @returns {Promise<Object>} 更新结果
     */
    static async updateAllHourFocusedStatus(hourFocusedCodes = []) {
        try {
            // 先将所有股票设为非小时线重点关注
            const resetResult = await Stock.updateMany(
                {},
                { $set: { isHourFocused: false } }
            );
            
            let focusedResult = { modifiedCount: 0 };
            // 如果有指定的小时线重点关注股票代码，则将它们设为重点关注
            if (hourFocusedCodes.length > 0) {
                focusedResult = await Stock.updateMany(
                    { code: { $in: hourFocusedCodes } },
                    { $set: { isHourFocused: true } }
                );
            }
            
            return {
                resetCount: resetResult.modifiedCount,
                focusedCount: focusedResult.modifiedCount,
                totalFocusedCodes: hourFocusedCodes.length
            };
        } catch (error) {
            logger.error('更新股票小时线重点关注状态失败:', error);
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