import logger from '~/utils/logger.js';
import BacktestExecutor from '../strategies/backtest.js';
import TaskDB from '../database/task.js';

/**
 * 任务执行器
 * 负责执行具体的任务，并更新任务状态
 */
class TaskExecutor {
  /**
   * 执行回测任务
   * @param {Object} task - 任务对象
   * @returns {Promise<Object>} 执行结果
   */
  static async executeBacktestTask(task) {
    try {
      logger.info(`开始执行回测任务: ${task.name}, ID: ${task._id}`);
      
      // 更新任务状态为处理中
      await TaskDB.updateTaskStatus(task._id, 'processing');
      
      // 执行回测
      const executor = new BacktestExecutor();
      const result = await executor.backtestAll(task);
      console.log(result)
      // 更新任务状态为已完成
      await TaskDB.updateTaskStatus(task._id, 'completed', result);
      
      logger.info(`回测任务执行完成: ${task.name}, ID: ${task._id}`);
      return result;
    } catch (error) {
      logger.error(`回测任务执行失败: ${task.name}, ID: ${task._id}`, error);
      
      // 更新任务状态为失败
      await TaskDB.updateTaskStatus(task._id, 'failed', { error: error.message });
      throw error;
    }
  }
  
  /**
   * 根据任务类型执行相应的任务
   * @param {Object} task - 任务对象
   * @returns {Promise<Object>} 执行结果
   */
  static async executeTask(task) {
    if (!task) {
      throw new Error('任务对象不能为空');
    }
    
    // 根据任务类型执行不同的任务
    switch (task.name) {
      case 'backtest':
        return await this.executeBacktestTask(task);
      default:
        // 默认当作回测任务处理
        return await this.executeBacktestTask(task);
    }
  }
}

export default TaskExecutor;