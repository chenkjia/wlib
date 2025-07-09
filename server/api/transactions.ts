import MongoDB from '../database/mongo.js';
import { Transaction } from '../database/models/transaction.js';

/**
 * 获取交易记录列表
 * @returns {Array} 交易记录列表
 */
export default defineEventHandler(async (event) => {
  try {
    // 确保MongoDB已连接
    await MongoDB.connect();
    
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const stockCode = query.stockCode as string;
    const sortBy = (query.sortBy as string) || 'buyTime';
    const sortOrder = (query.sortOrder as string) || 'desc';
    const isSellSuccess = query.isSellSuccess as string;

    // 构建过滤条件
    let filter: Record<string, any> = {};
    
    // 添加股票代码过滤
    if (stockCode) {
      filter.stockCode = stockCode;
    }
    
    // 添加卖出成功状态过滤
    if (isSellSuccess !== undefined) {
      filter.isSellSuccess = isSellSuccess === 'true';
    }
    
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // 使用Promise.all并行执行查询，提高性能
    const [total, transactions] = await Promise.race([
      Promise.all([
        Transaction.countDocuments(filter),
        Transaction.find(filter)
          .sort(sortOptions as { [key: string]: import('mongoose').SortOrder })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean() // 返回纯JavaScript对象，提高性能
      ]),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('获取交易记录列表超时')), 5000)
      )
    ]);

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