import MongoDB from '../../database/mongo.js';

/**
 * 创建简单任务记录
 * 只保存params参数
 */
export default defineEventHandler(async (event) => {
  try {
    await MongoDB.connect();
    const body = await readBody(event);
    
    // 简化的任务创建，只需要params参数
    const params = body.params || {};
    const name = body.name || 'task-' + Date.now();
    
    const task = await MongoDB.createTask(name, params);
    return { success: true, task };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw createError({
      statusCode: 500,
      message: `创建任务失败: ${errorMessage}`
    });
  }
});