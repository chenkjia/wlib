import MongoDB from '../database/mongo.js';
import logger from '~/utils/logger.js';
import { calculateDayMetric } from '~/utils/chartUtils.js';

/**
 * 重点关注股票管理服务
 */

/**
 * 计算股票是否应该被重点关注
 * @param {Array} dayLines - 股票日线数据
 * @returns {boolean} 是否应该重点关注
 */
function calculateIsFocused(dayLines) {
    if (!Array.isArray(dayLines) || dayLines.length === 0) {
        return false;
    }
    
    // 使用calculateDayMetric计算技术指标
    const metrics = calculateDayMetric(dayLines, {});
    
    if (!metrics.sign3 || metrics.sign3.length === 0) {
        return false;
    }
    
    // 判断最新的sign3值是否为1
    const latestSign3 = metrics.sign3[metrics.sign3.length - 1];
    return latestSign3 === 1;
}

/**
 * 更新所有股票的重点关注状态
 * @returns {Promise<Object>} 更新结果
 */
export async function updateFocusedStocks() {
    try {
        logger.info('开始更新股票重点关注状态');
        
        // 1. 获取所有股票列表
        const stockList = await MongoDB.getAll();
        logger.info(`获取到 ${stockList.length} 只股票`);
        
        const focusedCodes = [];
        let processedCount = 0;
        
        // 2. 循环处理每只股票
        for (const stock of stockList) {
            try {
                // 3. 读取股票的日线数据
                const stockData = await MongoDB.getStock(stock.code);
                
                // 4. 计算是否应该重点关注
                const shouldFocus = calculateIsFocused(stockData.dayLine);
                
                if (shouldFocus) {
                    focusedCodes.push(stock.code);
                }
                
                processedCount++;
                
                if (processedCount % 50 === 0) {
                    logger.info(`已处理 ${processedCount}/${stockList.length} 只股票`);
                }
            } catch (error) {
                logger.error(`处理股票 ${stock.code} 失败:`, error);
            }
        }
        
        // 5. 批量更新所有股票的重点关注状态
        const updateResult = await MongoDB.updateAllFocusedStatus(focusedCodes);
        
        logger.info(`股票重点关注状态更新完成: 重置${updateResult.resetCount}只股票，设置${updateResult.focusedCount}只为重点关注`);
        
        return {
            totalProcessed: processedCount,
            focusedCount: focusedCodes.length,
            updateResult
        };
    } catch (error) {
        logger.error('更新股票重点关注状态失败:', error);
        throw error;
    }
}