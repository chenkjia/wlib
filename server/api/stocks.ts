import MongoDB from '../database/mongo.js';
import logger from '../utils/logger.js';

// 定义股票列表返回类型
interface StockListResult {
  stocks: Array<{code: string, name: string}>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 获取股票列表
 * @param {Object} query - 查询参数，包含页码和每页数量
 * @returns {Object} 包含股票列表和总数的对象
 */
export default defineEventHandler(async (event) => {
  try {
    // 获取分页参数
    const query = getQuery(event)
    const page = parseInt(query.page as string) || 1
    const pageSize = parseInt(query.pageSize as string) || 20
    
    await MongoDB.connect();
    // 获取分页数据
    const result = await MongoDB.getList(page, pageSize) as StockListResult;
    
    if (!result || !result.stocks || !Array.isArray(result.stocks)) {
      throw new Error('获取的股票数据格式不正确');
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw createError({
      statusCode: 500,
      message: `获取股票列表失败: ${errorMessage}`
    });
  }
});