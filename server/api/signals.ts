import MongoDB from '../database/mongo.js';
import { Signal } from '../database/models/signal.js';

/**
 * 获取交易信号列表
 * @returns {Array} 交易信号列表
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

    const filter = stockCode ? { stockCode } : {};
    const sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    // 使用Promise.all并行执行查询，提高性能
    const [total, signals] = await Promise.race([
      Promise.all([
        Signal.countDocuments(filter),
        Signal.find(filter)
          .sort(sortOptions as { [key: string]: import('mongoose').SortOrder })
          .skip((page - 1) * pageSize)
          .limit(pageSize)
          .lean() // 返回纯JavaScript对象，提高性能
      ]),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('获取交易信号列表超时')), 5000)
      )
    ]);

    return {
      total,
      page,
      pageSize,
      data: signals
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw createError({
      statusCode: 500,
      message: `获取交易信号列表失败: ${errorMessage}`
    });
  }
});
