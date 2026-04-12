import MongoDB from '../database/mongo.js';

// 定义股票列表返回类型
interface StockListResult {
  stocks: Array<{code: string, name: string, isFocused: boolean, isHourFocused: boolean, focusedDays: number, hourFocusedDays: number, isStar?: boolean, macdTrendUpChannel?: boolean, macdDayTags?: string[], macdHourTags?: string[]}>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 获取股票列表
 * @returns {Object} 包含所有股票列表的对象
 */
export default defineEventHandler(async (event) => {
  try {
    // 获取查询参数
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 20;
    const search = query.search as string || '';
    // 只允许对有索引的字段进行排序
    const allowedSortFields = ['code', 'isFocused', 'isHourFocused', 'focusedDays', 'hourFocusedDays'];
    const requestedSortField = query.sortField as string || 'code';
    const sortField = allowedSortFields.includes(requestedSortField) ? requestedSortField : 'code';
    const sortOrder = query.sortOrder as string || 'asc';
    
    // 获取过滤参数
    const focusFilter = query.focusFilter as string || 'all';
    const hourFocusFilter = query.hourFocusFilter as string || 'all';
    const starFilter = query.starFilter as string || 'all';
    const macdTrendUpChannel = (query.macdTrendUpChannel as string) === '1' || (query.macdTrendUpChannel as string) === 'true';
    const macdDayTags = ((query.macdDayTags as string) || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    const macdHourTags = ((query.macdHourTags as string) || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    const hasMacdFilter = macdTrendUpChannel || macdDayTags.length > 0 || macdHourTags.length > 0;
    const includeCount = (query.noCount as string) !== '1' && !hasMacdFilter;
    const timeoutMs = hasMacdFilter
      ? (includeCount ? 30000 : 15000)
      : 5000;
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`获取股票列表超时(${timeoutMs}ms)`));
      }, timeoutMs);
    });

    // 确保MongoDB已连接
    await MongoDB.connect();
    
    // 使用Promise.race实现超时处理
    const result = await Promise.race([
      MongoDB.getList(page, pageSize, search, sortField, sortOrder, focusFilter, hourFocusFilter, starFilter, macdTrendUpChannel, macdDayTags, macdHourTags, includeCount),
      timeoutPromise
    ]) as StockListResult;
    
    if (!result || !result.stocks || !Array.isArray(result.stocks)) {
      throw new Error('获取的股票数据格式不正确');
    }
    
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw createError({
      statusCode: 500,
      message: `获取股票列表失败: ${errorMessage}`
    });
  }
});
