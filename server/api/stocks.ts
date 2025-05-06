import MongoDB from '../database/mongo.js';
import logger from '../utils/logger.js';

/**
 * 获取股票列表
 * @returns {Array} 股票列表
 */
export default defineEventHandler(async () => {
  try {
    const stocks = await MongoDB.getList();
    return stocks;
  } catch (error) {
    logger.error('获取股票列表失败:', error);
    throw createError({
      statusCode: 500,
      message: '获取股票列表失败'
    });
  }
});