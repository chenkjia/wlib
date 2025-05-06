import MongoDB from '../database/mongo.js';
import logger from '../utils/logger.js';

/**
 * 获取日线数据
 * @param {string} code - 股票代码
 * @param {string} startDate - 开始日期 (YYYY-MM-DD)
 * @param {string} endDate - 结束日期 (YYYY-MM-DD)
 * @returns {Array} 日线数据
 */
export default defineEventHandler(async (event) => {
  // 确保 code 参数为字符串类型
  // 使用可选链操作符避免未定义错误
//   const code = event.context?.params?.code as string;
//   if (!code) {
//     throw createError({
//       statusCode: 400,
//       message: '缺少股票代码参数'
//     });
//   }
  const { code } = getQuery(event);

  try {
    // 确保 code 参数为字符串类型
    const dayLine = await MongoDB.getDayLine(code as string);
    return dayLine;
  } catch (error) {
    logger.error(`获取股票 ${code} 日线数据失败:`, error);
    throw createError({
      statusCode: 500,
      message: '获取日线数据失败'
    });
  }
});