import MongoDB from '../database/mongo.js';
import logger from '../utils/logger.js';

/**
 * 获取日线数据
 * @param {string} code - 股票代码
 * @param {Date} startTime - 开始日期 (YYYY-MM-DD)
 * @param {Date} endTime - 结束日期 (YYYY-MM-DD)
 * @returns {Array} 日线数据
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const { code, startTime, endTime } = query;

  if (!code) {
    throw createError({
      statusCode: 400,
      message: '股票代码不能为空'
    });
  }

  try {
    await MongoDB.connect();
    const dayLine = await MongoDB.getDayLine(
      code as string, 
      startTime ? startTime as Date : undefined, 
      endTime ? endTime as Date : undefined
    );
    return dayLine;
  } catch (error) {
    logger.error(`获取股票 ${code} 日线数据失败:`, error);
    throw createError({
      statusCode: 500,
      message: '获取日线数据失败'
    });
  }
});