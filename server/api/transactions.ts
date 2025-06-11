import MongoDB from '../database/mongo.js';
import { Transaction } from '../database/models/transaction.js';

/**
 * 获取交易记录列表
 * @returns {Array} 交易记录列表
 */
export default defineEventHandler(async (event) => {
  try {
    await MongoDB.connect();
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const stockCode = query.stockCode as string;
    const sortBy = (query.sortBy as string) || 'buyTime';
    const sortOrder = (query.sortOrder as string) || 'desc';

    const filter = stockCode ? { stockCode } : {};
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const total = await Transaction.countDocuments(filter);
    const transactions = await Transaction.find(filter)
      .sort(sortOptions as { [key: string]: import('mongoose').SortOrder })
      .skip((page - 1) * pageSize)
      .limit(pageSize);

    return {
      total,
      page,
      pageSize,
      data: transactions
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw createError({
      statusCode: 500,
      message: `获取交易记录列表失败: ${errorMessage}`
    });
  }
});