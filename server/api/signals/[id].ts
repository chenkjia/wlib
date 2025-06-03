import MongoDB from '../../database/mongo.js';
import logger from '../../utils/logger.js';

/**
 * 通过ID获取交易信号
 * @param {string} id - 信号ID
 * @returns {Object} 交易信号详情
 */
export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '信号ID不能为空'
    });
  }

  try {
    await MongoDB.connect();
    const signal = await MongoDB.getSignal(id);
    
    if (!signal) {
      throw createError({
        statusCode: 404,
        message: '信号不存在'
      });
    }

    return signal;
  } catch (error) {
    logger.error(`获取信号 ${id} 详情失败:`, error);
    throw createError({
      statusCode: 500,
      message: '获取信号详情失败'
    });
  }
});