import logger from '~/utils/logger.js';
import { Stock } from './models/stock.js';

/**
 * 股票列表数据库操作类
 */
class StockDB {
    static macdFieldIndexesEnsured = false;
    static macdFieldIndexesEnsuring = false;

    static isMissingHintIndexError(error) {
        return Boolean(error?.message?.includes('hint provided does not correspond to an existing index'));
    }

    static escapeRegex(value = '') {
        return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    static async ensureMacdFieldIndexes() {
        if (StockDB.macdFieldIndexesEnsured || StockDB.macdFieldIndexesEnsuring) {
            return;
        }
        StockDB.macdFieldIndexesEnsuring = true;
        try {
            await Stock.collection.createIndex({ macdTrendUpChannel: 1, code: 1 }, { background: true });
            await Stock.collection.createIndex({ macdDayTags: 1 }, { background: true });
            await Stock.collection.createIndex({ macdHourTags: 1 }, { background: true });
            StockDB.macdFieldIndexesEnsured = true;
        } catch (error) {
            logger.warn('确保MACD标签索引失败，将继续无索引查询:', error?.message || error);
        } finally {
            StockDB.macdFieldIndexesEnsuring = false;
        }
    }

    static async countDocumentsWithHintFallback(query, hint) {
        try {
            return await Stock.countDocuments(query).hint(hint);
        } catch (error) {
            if (StockDB.isMissingHintIndexError(error)) {
                return Stock.countDocuments(query);
            }
            throw error;
        }
    }

    static async findWithHintFallback(query, projection, hint, sort = null, skip = null, limit = null) {
        try {
            let finder = Stock.find(query, projection).hint(hint);
            if (sort) {
                finder = finder.sort(sort);
            }
            if (typeof skip === 'number') {
                finder = finder.skip(skip);
            }
            if (typeof limit === 'number') {
                finder = finder.limit(limit);
            }
            return await finder.lean();
        } catch (error) {
            if (StockDB.isMissingHintIndexError(error)) {
                let finder = Stock.find(query, projection);
                if (sort) {
                    finder = finder.sort(sort);
                }
                if (typeof skip === 'number') {
                    finder = finder.skip(skip);
                }
                if (typeof limit === 'number') {
                    finder = finder.limit(limit);
                }
                return finder.lean();
            }
            throw error;
        }
    }

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
    static async getList(page = 1, pageSize = 20, search = '', searchField = 'all', sortField = 'code', sortOrder = 'asc', focusFilter = 'all', hourFocusFilter = 'all', starFilter = 'all', macdTrendUpChannel = false, macdDayTags = [], macdHourTags = [], includeCount = true) {
        try {
            // 计算跳过的文档数量
            const skip = (page - 1) * pageSize;
            
            // 构建查询条件，大小写不敏感的搜索
            let query = { };
            if (search) {
                const escapedSearch = StockDB.escapeRegex(search);
                if (searchField === 'code') {
                    // 代码搜索走前缀匹配，优先命中 code 索引
                    query = { code: { $regex: new RegExp(`^${escapedSearch}`) } };
                } else if (searchField === 'name') {
                    query = { name: { $regex: new RegExp(`^${escapedSearch}`) } };
                } else {
                    // 通用搜索支持股票代码和名称
                    query = {
                        $or: [
                            { code: { $regex: new RegExp('^' + escapedSearch, 'i') } },
                            { name: { $regex: new RegExp('^' + escapedSearch, 'i') } }
                        ]
                    };
                }
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

            if (macdTrendUpChannel) {
                query.macdTrendUpChannel = true;
            }

            if (Array.isArray(macdDayTags) && macdDayTags.length > 0) {
                query.macdDayTags = { $all: macdDayTags };
            }

            if (Array.isArray(macdHourTags) && macdHourTags.length > 0) {
                query.macdHourTags = { $all: macdHourTags };
            }
            
            // 使用Promise.all并行执行查询总数和查询数据，提高性能
            const shouldUseCodeHint = Object.keys(query).length === 0 || (Object.keys(query).length === 1 && query.code);
            const hasMacdFilter = macdTrendUpChannel || (Array.isArray(macdDayTags) && macdDayTags.length > 0) || (Array.isArray(macdHourTags) && macdHourTags.length > 0);
            if (hasMacdFilter) {
                StockDB.ensureMacdFieldIndexes();
            }
            const projection = {
                _id: 0, // 不返回_id字段
                code: 1,
                name: 1,
                isFocused: 1,
                isHourFocused: 1,
                focusedDays: 1,
                hourFocusedDays: 1,
                isStar: 1,
                macdTrendUpChannel: 1,
                macdDayTags: 1,
                macdHourTags: 1
            };
            const sortSpec = { [sortField]: sortOrder === 'asc' ? 1 : -1 };
            const trendHint = { macdTrendUpChannel: 1, code: 1 };

            if (!includeCount) {
                const stocks = macdTrendUpChannel && !search && macdDayTags.length === 0 && macdHourTags.length === 0
                    ? await StockDB.findWithHintFallback(query, projection, trendHint, sortSpec, skip, pageSize)
                    : await Stock.find(query, projection)
                        .sort(sortSpec)
                        .skip(skip)
                        .limit(pageSize)
                        .lean();
                return {
                    stocks,
                    total: stocks.length,
                    page,
                    pageSize,
                    totalPages: 1
                };
            }

            const [total, stocks] = await Promise.all([
                shouldUseCodeHint
                    ? StockDB.countDocumentsWithHintFallback(query, { code: 1 })
                    : (macdTrendUpChannel && !search && macdDayTags.length === 0 && macdHourTags.length === 0
                        ? StockDB.countDocumentsWithHintFallback(query, trendHint)
                        : Stock.countDocuments(query)),
                
                // 查询当前页的数据 - 明确指定只获取需要的字段
                macdTrendUpChannel && !search && macdDayTags.length === 0 && macdHourTags.length === 0
                    ? StockDB.findWithHintFallback(query, projection, trendHint, sortSpec, skip, pageSize)
                    : Stock.find(query, projection)
                        .sort(sortSpec) // 动态排序
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
            const stocks = await StockDB.findWithHintFallback(
                query,
                {
                    _id: 0, // 不返回_id字段
                    code: 1,
                    name: 1,
                    isFocused: 1,
                    isHourFocused: 1,
                    macdTrendUpChannel: 1,
                    macdDayTags: 1,
                    macdHourTags: 1
                },
                { code: 1 },
                { code: 1 }
            );
            
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
            const stocks = await StockDB.findWithHintFallback(
                { isFocused: true },
                {
                    _id: 0,
                    code: 1,
                    name: 1
                },
                { isFocused: 1 },
                { code: 1 }
            );
            
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
     * 向观察列表追加股票（isFocused = true）
     * @param {Array<string>} codes 股票代码列表
     * @returns {Promise<Object>}
     */
    static async addToWatchlist(codes = []) {
        try {
            const normalizedCodes = Array.from(new Set((Array.isArray(codes) ? codes : [])
                .map(code => String(code || '').trim())
                .filter(Boolean)));
            if (normalizedCodes.length === 0) {
                return { matchedCount: 0, modifiedCount: 0 };
            }
            const result = await Stock.updateMany(
                { code: { $in: normalizedCodes } },
                { $set: { isFocused: true } }
            );
            return {
                matchedCount: result.matchedCount || 0,
                modifiedCount: result.modifiedCount || 0
            };
        } catch (error) {
            logger.error('追加观察列表失败:', error);
            throw error;
        }
    }

    /**
     * 清空观察列表（所有股票 isFocused = false）
     * @returns {Promise<Object>}
     */
    static async clearWatchlist() {
        try {
            const result = await Stock.updateMany({}, { $set: { isFocused: false } });
            return {
                matchedCount: result.matchedCount || 0,
                modifiedCount: result.modifiedCount || 0
            };
        } catch (error) {
            logger.error('清空观察列表失败:', error);
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

    static async getStockCodesForMacdTagging() {
        try {
            return await Stock.find(
                {},
                {
                    _id: 0,
                    code: 1
                }
            ).lean();
        } catch (error) {
            logger.error('获取MACD标签股票清单失败:', error);
            throw error;
        }
    }

    static async getStockLineForMacdTagging(code) {
        try {
            return await Stock.findOne(
                { code },
                {
                    _id: 0,
                    code: 1,
                    dayLine: 1,
                    hourLine: 1,
                    adjustFactor: 1
                }
            ).lean();
        } catch (error) {
            logger.error(`获取股票 ${code} 的MACD标签源数据失败:`, error);
            throw error;
        }
    }

    static async bulkUpdateMacdFields(tagDataList = []) {
        try {
            if (!Array.isArray(tagDataList) || tagDataList.length === 0) {
                return { matchedCount: 0, modifiedCount: 0 };
            }

            const operations = tagDataList.map(item => ({
                updateOne: {
                    filter: { code: item.code },
                    update: {
                        $set: {
                            macdTrendUpChannel: Boolean(item.macdTrendUpChannel),
                            macdDayTags: Array.isArray(item.macdDayTags) ? item.macdDayTags : [],
                            macdHourTags: Array.isArray(item.macdHourTags) ? item.macdHourTags : []
                        }
                    }
                }
            }));

            const result = await Stock.bulkWrite(operations, { ordered: false });
            return {
                matchedCount: result.matchedCount || 0,
                modifiedCount: result.modifiedCount || 0
            };
        } catch (error) {
            logger.error('批量更新MACD字段失败:', error);
            throw error;
        }
    }
}

export default StockDB;
