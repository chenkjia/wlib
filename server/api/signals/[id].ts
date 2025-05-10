import MongoDB from '../../database/mongo.js';

/**
 * 通过ID获取交易信号
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
    const signal = await MongoDB.getSignalById(id);
    return signal;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw createError({
      statusCode: 500,
      message: `获取交易信号详情失败: ${errorMessage}`
    });
  }
}); 