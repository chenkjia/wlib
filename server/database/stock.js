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
     * @param {string} sortField - 排序字段
     * @param {string} sortOrder - 排序方向
     * @param {string} focusFilter - 重点关注过滤器
     * @param {string} hourFocusFilter - 小时线关注过滤器
     * @param {string} starFilter - 星标过滤器
     * @returns {Promise<Object>} 包含股票列表和总数的对象
     */
    static async getList(page = 1, pageSize = 20, search = '', sortField = 'code', sortOrder = 'asc', focusFilter = 'all', hourFocusFilter = 'all', starFilter = 'all') {
        try {
            // 计算跳过的文档数量
            const skip = (page - 1) * pageSize;
            
            // 构建查询条件，大小写不敏感的搜索
            let query = { };
            if (search) {
                // 使用正则表达式实现大小写不敏感的模糊搜索，支持股票代码和名称
                query = {
                    $or: [
                        { code: { $regex: new RegExp('^' + search, 'i') } },
                        { name: { $regex: new RegExp('^' + search, 'i') } }
                    ]
                };
            }
            
            // 添加重点关注过滤条件
            if (focusFilter === 'focused') {
                query.isFocused = true;
            } else if (focusFilter === 'unfocused') {
                query.isFocused = { $ne: true };
            }
            
            // 添加小时线关注过滤条件
            if (hourFocusFilter === 'focused') {
                query.isHourFocused = true;
            } else if (hourFocusFilter === 'unfocused') {
                query.isHourFocused = { $ne: true };
            }
            
            // 添加星标过滤条件
            if (starFilter === 'starred') {
                query.isStar = true;
            } else if (starFilter === 'unstarred') {
                query.isStar = { $ne: true };
            }
            
            // 使用Promise.all并行执行查询总数和查询数据，提高性能
            const [total, stocks] = await Promise.all([
                // 查询总数 - 根据查询条件决定是否使用索引提示
                Object.keys(query).length === 0 || (Object.keys(query).length === 1 && query.code) 
                    ? Stock.countDocuments(query).hint({ code: 1 })
                    : Stock.countDocuments(query),
                
                // 查询当前页的数据 - 明确指定只获取需要的字段
                Stock.find(query, {
                    _id: 0, // 不返回_id字段
                    code: 1,
                    name: 1,
                    isFocused: 1,
                    isHourFocused: 1,
                    focusedDays: 1,
                    hourFocusedDays: 1
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
                // 使用正则表达式实现大小写不敏感的模糊搜索，支持股票代码和名称
                query = {
                    $or: [
                        { code: { $regex: new RegExp(search, 'i') } },
                        { name: { $regex: new RegExp(search, 'i') } }
                    ]
                };
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
     * 更新所有股票的日线关注天数
     * @param {Object} focusedDaysMap - 股票代码到关注天数的映射 {code: days}
     * @returns {Promise<Object>} 更新结果
     */
    static async updateAllFocusedDays(focusedDaysMap = {}) {
        try {
            // 先将所有股票的关注天数重置为0
            const resetResult = await Stock.updateMany(
                {},
                { $set: { focusedDays: 0 } }
            );
            
            let updateCount = 0;
            // 批量更新有关注天数的股票
            for (const [code, days] of Object.entries(focusedDaysMap)) {
                if (days !== 0) {
                    await Stock.updateOne(
                        { code: code },
                        { $set: { focusedDays: days, isFocused: days > 0 } }
                    );
                    updateCount++;
                }
            }
            
            return {
                resetCount: resetResult.modifiedCount,
                updateCount: updateCount,
                totalCodes: Object.keys(focusedDaysMap).length
            };
        } catch (error) {
            logger.error('更新股票日线关注天数失败:', error);
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
     * 更新单个股票信息
     * @param {string} code - 股票代码
     * @param {Object} updateData - 要更新的数据
     * @returns {Promise<Object>} 更新结果
     */
    static async updateStock(code, updateData) {
        try {
            const result = await Stock.updateOne(
                { code: code },
                { $set: updateData }
            );
            
            if (result.matchedCount === 0) {
                throw new Error(`股票代码 ${code} 不存在`);
            }
            
            return {
                matchedCount: result.matchedCount,
                modifiedCount: result.modifiedCount,
                acknowledged: result.acknowledged
            };
        } catch (error) {
            logger.error('更新股票信息失败:', error);
            throw error;
        }
    }

    /**
 * 更新股票星标状态
 * @param {string} code - 股票代码
 * @param {boolean} isStar - 是否星标
 * @returns {Promise<Object>} 更新结果
 */
static async updateStockStar(code, isStar) {
    try {
        const result = await Stock.updateOne(
            { code },
            { $set: { isStar } }
        );
        
        return {
            code,
            isStar,
            updated: result.modifiedCount > 0
        };
    } catch (error) {
        logger.error(`更新股票 ${code} 星标状态失败:`, error);
        throw error;
    }
}

/**
 * 获取所有星标股票
 * @returns {Promise<Array>} 星标股票列表
 */
static async getStarredStocks() {
    try {
        const stocks = await Stock.find({ isStar: true });
        return stocks;
    } catch (error) {
        logger.error('获取星标股票失败:', error);
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