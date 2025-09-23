import logger from '~/utils/logger.js';
import TaskExecutor from './taskExecutor.js';

/**
 * 任务队列管理器
 * 负责管理任务队列，确保任务按照FIFO原则执行
 */
class TaskQueueManager {
  constructor() {
    this.taskQueue = [];
    this.isProcessing = false;
    this.currentTask = null;
  }

  /**
   * 获取单例实例
   * @returns {TaskQueueManager} 任务队列管理器实例
   */
  static getInstance() {
    if (!TaskQueueManager.instance) {
      TaskQueueManager.instance = new TaskQueueManager();
    }
    return TaskQueueManager.instance;
  }

  /**
   * 添加任务到队列
   * @param {Object} task - 任务对象
   */
  addTask(task) {
    logger.info(`添加任务到队列: ${task.name}, ID: ${task._id}`);
    this.taskQueue.push(task);
    
    // 如果当前没有正在处理的任务，则开始处理队列
    if (!this.isProcessing) {
      this.processQueue();
    }
  }

  /**
   * 处理队列中的任务
   */
  async processQueue() {
    if (this.isProcessing || this.taskQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    
    try {
      // 从队列中取出第一个任务
      this.currentTask = this.taskQueue.shift();
      const task = this.currentTask;
      
      logger.info(`开始处理任务: ${task.name}, ID: ${task._id}`);
      
      // 使用任务执行器执行任务
      await TaskExecutor.executeTask(task);
      
      logger.info(`任务处理完成: ${task.name}, ID: ${task._id}`);
    } catch (error) {
      if (this.currentTask) {
        logger.error(`任务处理失败: ${this.currentTask.name}, ID: ${this.currentTask._id}`, error);
      } else {
        logger.error('任务处理失败，无法获取当前任务信息', error);
      }
    } finally {
      this.isProcessing = false;
      this.currentTask = null;
      
      // 如果队列中还有任务，继续处理
      if (this.taskQueue.length > 0) {
        this.processQueue();
      }
    }
  }

  /**
   * 获取当前队列状态
   * @returns {Object} 队列状态信息
   */
  getQueueStatus() {
    return {
      queueLength: this.taskQueue.length,
      isProcessing: this.isProcessing,
      currentTask: this.currentTask ? {
        id: this.currentTask._id,
        name: this.currentTask.name
      } : null
    };
  }
}

// 创建单例实例
const taskQueueManager = TaskQueueManager.getInstance();

export default taskQueueManager;