import MongoDB from '../../database/mongo.js';

/**
 * 获取所有星标股票
 * @returns {Object} 星标股票列表
 */
export default defineEventHandler(async () => {
  try {
    // 确保MongoDB已连接
    await MongoDB.connect();
    
    // 获取星标股票列表
    const starredStocks = await MongoDB.getStarredStocks();
    
    return {
      success: true,
      data: starredStocks
    };
  } catch (error: any) {
    console.error('获取星标股票列表失败:', error);
    return {
      success: false,
      message: `获取星标股票列表失败: ${error.message}`
    };
  }
});