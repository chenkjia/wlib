import MongoDB from '../../database/mongo.js';

/**
 * 更新股票星标状态
 * @returns {Object} 更新结果
 */
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { code, isStar } = body;
    
    if (!code) {
      return {
        success: false,
        message: '股票代码不能为空'
      };
    }
    
    if (typeof isStar !== 'boolean') {
      return {
        success: false,
        message: '星标状态必须是布尔值'
      };
    }
    
    // 确保MongoDB已连接
    await MongoDB.connect();
    
    // 如果要添加星标，检查数量限制
    if (isStar) {
      const starredStocks = await MongoDB.getStarredStocks();
      if (starredStocks.length >= 10) {
        return {
          success: false,
          message: '最多只能添加10个星标股票！'
        };
      }
    }
    
    // 更新股票星标状态
    const result = await MongoDB.updateStockStar(code, isStar);
    
    return {
      success: true,
      data: result
    };
  } catch (error: any) {
    console.error('更新股票星标状态失败:', error);
    return {
      success: false,
      message: `更新股票星标状态失败: ${error.message}`
    };
  }
});