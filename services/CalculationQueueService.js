/**
 * 计算队列服务
 * 用于管理全局计算任务队列，确保任务按顺序处理
 */

class CalculationQueueService {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.results = new Map(); // 存储计算结果
    this.listeners = new Map(); // 存储状态监听器
  }

  /**
   * 添加计算任务到队列
   * @param {Object} task 计算任务对象
   * @param {Object} task.params 计算参数
   * @param {string} task.id 任务ID
   * @returns {string} 任务ID
   */
  addTask(task) {
    const taskId = task.id || `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTask = {
      ...task,
      id: taskId,
      status: 'pending',
      addedAt: new Date(),
      result: null
    };
    
    this.queue.push(newTask);
    console.log(`[CalculationQueueService] 添加任务: ${taskId}, 当前队列长度: ${this.queue.length}`);
    
    // 如果队列没有在处理中，开始处理
    if (!this.isProcessing) {
      this.processQueue();
    }
    
    return taskId;
  }

  /**
   * 处理队列中的任务
   * @private
   */
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    this.notifyListeners();

    try {
      const task = this.queue[0];
      task.status = 'processing';
      this.notifyListeners();
      
      console.log(`[CalculationQueueService] 开始处理任务: ${task.id}`);
      
      // 模拟计算任务处理
      const result = await this.processTask(task);
      
      // 更新任务状态和结果
      task.status = 'completed';
      task.completedAt = new Date();
      task.result = result;
      
      // 存储结果
      this.results.set(task.id, result);
      
      // 保存结果到数据库
      await this.saveResultToDatabase(task.id, result);
      
      console.log(`[CalculationQueueService] 任务完成: ${task.id}`);
      
      // 从队列中移除已完成的任务
      this.queue.shift();
      
      this.notifyListeners();
    } catch (error) {
      const task = this.queue[0];
      task.status = 'failed';
      task.error = error.message;
      console.error(`[CalculationQueueService] 任务处理失败: ${task.id}`, error);
      
      // 从队列中移除失败的任务
      this.queue.shift();
      
      this.notifyListeners();
    }

    this.isProcessing = false;
    
    // 如果队列中还有任务，继续处理
    if (this.queue.length > 0) {
      this.processQueue();
    }
  }

  /**
   * 处理单个计算任务
   * @param {Object} task 计算任务
   * @returns {Promise<Object>} 计算结果
   * @private
   */
  async processTask(task) {
    try {
      // 导入计算任务处理器
      const { processCalculationTask } = await import('./CalculationTaskProcessor.js');
      
      // 使用处理器处理任务
      return await processCalculationTask(task);
    } catch (error) {
      console.error(`[CalculationQueueService] 处理任务失败: ${task.id}`, error);
      throw error;
    }
  }

  /**
   * 保存结果到数据库
   * @param {string} taskId 任务ID
   * @param {Object} result 计算结果
   * @returns {Promise<void>}
   * @private
   */
  async saveResultToDatabase(taskId, result) {
    // 这里是模拟保存到数据库的操作，实际应用中可以替换为真实的数据库操作
    console.log(`[CalculationQueueService] 保存任务结果到数据库: ${taskId}`);
    
    // 模拟异步操作
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(`[CalculationQueueService] 任务结果已保存: ${taskId}`);
        resolve();
      }, 500);
    });
  }

  /**
   * 获取队列状态
   * @returns {Object} 队列状态
   */
  getStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
      currentTask: this.queue.length > 0 ? this.queue[0] : null,
      pendingTasks: this.queue.slice(1),
      completedCount: this.results.size
    };
  }

  /**
   * 获取任务结果
   * @param {string} taskId 任务ID
   * @returns {Object|null} 任务结果，如果不存在则返回null
   */
  getTaskResult(taskId) {
    return this.results.get(taskId) || null;
  }

  /**
   * 添加状态变化监听器
   * @param {string} id 监听器ID
   * @param {Function} callback 回调函数
   */
  addListener(id, callback) {
    this.listeners.set(id, callback);
  }

  /**
   * 移除状态变化监听器
   * @param {string} id 监听器ID
   */
  removeListener(id) {
    this.listeners.delete(id);
  }

  /**
   * 通知所有监听器状态变化
   * @private
   */
  notifyListeners() {
    const status = this.getStatus();
    this.listeners.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('[CalculationQueueService] 通知监听器失败:', error);
      }
    });
  }

  /**
   * 清空队列
   */
  clearQueue() {
    this.queue = [];
    this.notifyListeners();
    console.log('[CalculationQueueService] 队列已清空');
  }
}

// 创建单例实例
const calculationQueueService = new CalculationQueueService();

export default calculationQueueService;