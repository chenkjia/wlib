import MongoDB from '../../database/mongo.js';
import logger from '../../utils/logger.js';

/**
 * 通过ID获取交易记录
 * @param {string} id - 交易记录ID
 * @returns {Object} 交易记录详情
 */
export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '交易记录ID不能为空'
    });
  }

  try {
    await MongoDB.connect();
    const transaction = await MongoDB.getTransaction(id);
    
    if (!transaction) {
      throw createError({
        statusCode: 404,
        message: '交易记录不存在'
      });
    }

    return transaction;
  } catch (error) {
    logger.error(`获取交易记录 ${id} 详情失败:`, error);
    throw createError({
      statusCode: 500,
      message: '获取交易记录详情失败'
    });
  }
});