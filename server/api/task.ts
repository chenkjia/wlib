import MongoDB from '../database/mongo.js';

/**
 * 获取任务列表
 * @returns {Object} 包含任务列表和分页信息
 */
export default defineEventHandler(async (event) => {
  try {
    // 确保MongoDB已连接
    await MongoDB.connect();
    
    const query = getQuery(event);
    const page = parseInt(query.page as string) || 1;
    const pageSize = parseInt(query.pageSize as string) || 10;
    const status = query.status as string;
    const name = query.name as string;
    const sortBy = (query.sortBy as string) || 'createdAt';
    const sortOrder = (query.sortOrder as string) || 'desc';

    // 构建过滤条件
    const filter: Record<string, any> = {};
    if (status) filter.status = status;
    if (name) filter.name = name;
    
    // 获取任务列表
    const tasks = await MongoDB.getTasks(filter);
    
    // 手动处理分页和排序
    const sortedTasks = tasks.sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      if (sortOrder === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });
    
    const total = sortedTasks.length;
    const paginatedTasks = sortedTasks.slice((page - 1) * pageSize, page * pageSize);

    return {
      total,
      page,
      pageSize,
      data: paginatedTasks
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw createError({
      statusCode: 500,
      message: `获取任务列表失败: ${errorMessage}`
    });
  }
});