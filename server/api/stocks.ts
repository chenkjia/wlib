import MongoDB from '../database/mongo.js';
import logger from '../utils/logger.js';

/**
 * 获取股票列表
 * @returns {Array} 股票列表
 */
export default defineEventHandler(async () => {
  try {
    await MongoDB.connect();
    const stocks = await MongoDB.getList();
    if (!stocks || !Array.isArray(stocks)) {
      throw new Error('获取的股票数据格式不正确');
    }
    return stocks;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw createError({
      statusCode: 500,
      message: `获取股票列表失败: ${errorMessage}`
    });
  }
});