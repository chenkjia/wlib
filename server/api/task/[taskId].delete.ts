import MongoDB from '../../database/mongo.js';

/**
 * 删除指定ID的任务
 * @route DELETE /api/task/:taskId
 * @param {string} taskId - 任务ID
 * @returns {Object} 删除结果
 */
export default defineEventHandler(async (event) => {
  try {
    // 确保MongoDB已连接
    await MongoDB.connect();
    
    // 获取任务ID
    const taskId = event.context.params?.taskId;
    
    if (!taskId) {
      throw createError({
        statusCode: 400,
        message: '缺少任务ID'
      });
    }
    
    // 删除任务
    const result = await MongoDB.deleteTask(taskId);
    
    return {
      success: true,
      message: '任务删除成功',
      data: result
    };
  } catch (error: any) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw createError({
      statusCode: error.statusCode || 500,
      message: `删除任务失败: ${errorMessage}`
    });
  }
});