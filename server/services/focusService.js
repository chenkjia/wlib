import MongoDB from '../database/mongo.js';
import logger from '~/utils/logger.js';
import { calculateDayMetric, calculateHourMetric } from '~/utils/chartUtils.js';

/**
 * 重点关注股票管理服务
 */

/**
 * 计算股票日线连续关注天数（基于日线数据）
 * @param {Array} dayLines - 股票日线数据
 * @returns {number} 连续关注天数，正数表示正向关注天数，负数表示负向关注天数，0表示不关注
 */
function calculateIsFocused(dayLines) {
    if (!Array.isArray(dayLines) || dayLines.length === 0) {
        return 0;
    }
    
    // 使用calculateDayMetric计算技术指标
    const metrics = calculateDayMetric(dayLines, {});
    
    if (!metrics.trendAlignment || metrics.trendAlignment.length <= 0) {
        return 0;
    }
    
    logger.info(metrics.trendAlignment)
    // 返回最新的trendAlignment值（连续关注天数）
    const trendAlignment = metrics.trendAlignment[metrics.trendAlignment.length - 1];
    return trendAlignment;
}

/**
 * 计算股票小时线连续关注天数（基于小时线数据）
 * @param {Array} hourLines - 股票小时线数据
 * @returns {number} 连续关注天数，正数表示正向关注天数，负数表示负向关注天数，0表示不关注
 */
function calculateIsHourFocused(hourLines) {
    if (!Array.isArray(hourLines) || hourLines.length === 0) {
        return 0;
    }
    
    // 使用calculateHourMetric计算小时线技术指标
    const metrics = calculateHourMetric(hourLines, {});
    if (!metrics.trendAlignment || metrics.trendAlignment.length <= 0) {
        return 0;
    }
    logger.info(metrics.trendAlignment)
    // 返回最新的trendAlignment值（连续关注天数）
    const trendAlignment = metrics.trendAlignment[metrics.trendAlignment.length - 1];
    return trendAlignment;
}

/**
 * 更新所有股票的重点关注状态和关注天数
 * @returns {Promise<Object>} 更新结果
 */
export async function updateFocusedStocks() {
    try {
        logger.info('开始更新股票重点关注状态和关注天数');
        
        // 1. 获取所有股票列表
        // const stockList = [await MongoDB.getStock('ATR')]
        const stockList = await MongoDB.getAll();
        // ATR
        logger.info(`获取到 ${stockList.length} 只股票`);
        
        let processedCount = 0;
        
        // 2. 循环处理每只股票
        for (const stock of stockList) {
            try {
                // 3. 读取股票的日线数据
                const stockData = await MongoDB.getStock(stock.code);
                
                // 4. 计算关注天数
                const focusedDays = calculateIsFocused(stockData.dayLine);
                await MongoDB.updateStock(stock.code,{
                    isFocused: focusedDays > 0,
                    focusedDays
                })
                processedCount++;
                logger.info(`股票 ${stock.code} 关注天数: ${focusedDays}`);
                if (processedCount % 50 === 0) {
                    logger.info(`已处理 ${processedCount}/${stockList.length} 只股票`);
                }
            } catch (error) {
                logger.error(`处理股票 ${stock.code} 失败:`, error);
            }
        }

        
        return {
            totalProcessed: processedCount,
            updateResult: processedCount
        };
    } catch (error) {
        logger.error('更新股票重点关注状态失败:', error);
        throw error;
    }
}

/**
 * 更新所有股票的小时线关注状态和关注天数
 * @returns {Promise<Object>} 更新结果
 */
export async function updateHourFocusedStocks() {
    try {
        logger.info('开始更新股票小时线关注状态和关注天数');
        
        // 1. 获取所有股票列表
        const stockList = await MongoDB.getAll();
        logger.info(`获取到 ${stockList.length} 只股票`);
        
        let processedCount = 0;
        
        // 2. 循环处理每只股票
        for (const stock of stockList) {
            try {
                // 3. 读取股票的小时线数据
                const stockData = await MongoDB.getStock(stock.code);
                
                // 4. 计算小时线关注天数
                const hourFocusedDays = calculateIsHourFocused(stockData.hourLine);
                await MongoDB.updateStock(stock.code,{
                    isHourFocused: hourFocusedDays > 0,
                    hourFocusedDays
                })
                logger.info(`股票 ${stock.code} 小时线关注天数: ${hourFocusedDays}`);
                processedCount++;
                
                if (processedCount % 50 === 0) {
                    logger.info(`已处理 ${processedCount}/${stockList.length} 只股票`);
                }
            } catch (error) {
                logger.error(`处理股票 ${stock.code} 失败:`, error);
            }
        }
        
        
        logger.info(`股票小时线关注天数更新完成: 总共处理${processedCount}只股票`);
        
        return {
            totalProcessed: processedCount,
            updateCount: processedCount
        };
    } catch (error) {
        logger.error('更新股票小时线关注状态失败:', error);
        throw error;
    }
}