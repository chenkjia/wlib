import logger from '~/utils/logger.js';
import { Task } from './models/task.js';
import taskQueueManager from '../services/taskQueueManager.js';

/**
 * 任务数据库操作类
 */
class TaskDB {
    /**
     * 通过ID获取任务
     * @param {string} id - 任务ID
     * @returns {Promise<Object>} 任务数据
     */
    static async getTask(id) {
        try {
            const task = await Task.findById(id);
            if (!task) {
                throw new Error(`任务ID ${id} 不存在`);
            }
            return task;
        } catch (error) {
            logger.error('通过ID获取任务失败:', error);
            throw error;
        }
    }

    /**
     * 创建新任务
     * @param {string} name - 任务名称
     * @param {Object} params - 任务参数
     * @returns {Promise<Object>} 创建的任务
     */
    static async createTask(name, params = {}) {
        try {
            const task = new Task({
                name,
                params,
                status: 'pending',
                progress: 0
            });
            await task.save();
            
            // 将任务添加到队列中，而不是直接执行
            taskQueueManager.addTask(task);
            
            return task;
        } catch (error) {
            logger.error('创建任务失败:', error);
            throw error;
        }
    }

    /**
     * 更新任务状态
     * @param {string} id - 任务ID
     * @param {string} status - 任务状态
     * @param {Object} result - 任务结果
     * @returns {Promise<Object>} 更新后的任务
     */
    static async updateTaskStatus(id, status, result = null) {
        try {
            const task = await Task.findById(id);
            if (!task) {
                throw new Error(`任务ID ${id} 不存在`);
            }
            
            task.status = status;
            task.updatedAt = new Date();
            
            if (result) {
                task.result = result;
            }
            
            await task.save();
            return task;
        } catch (error) {
            logger.error('更新任务状态失败:', error);
            throw error;
        }
    }

    /**
     * 更新任务进度
     * @param {string} id - 任务ID
     * @param {number} progress - 任务进度 (0-100)
     * @returns {Promise<Object>} 更新后的任务
     */
    static async updateTaskProgress(id, progress) {
        try {
            const task = await Task.findById(id);
            if (!task) {
                throw new Error(`任务ID ${id} 不存在`);
            }
            
            task.progress = progress;
            task.updatedAt = new Date();
            
            await task.save();
            return task;
        } catch (error) {
            logger.error('更新任务进度失败:', error);
            throw error;
        }
    }
    
    /**
     * 更新任务信息
     * @param {string} id - 任务ID
     * @param {Object} updateData - 更新数据
     * @returns {Promise<Object>} 更新后的任务
     */
    static async updateTask(id, updateData) {
        try {
            const task = await Task.findById(id);
            if (!task) {
                throw new Error(`任务ID ${id} 不存在`);
            }
            
            // 更新任务字段
            if (updateData.name) {
                task.name = updateData.name;
            }
            
            task.updatedAt = new Date();
            
            await task.save();
            return task;
        } catch (error) {
            logger.error('更新任务信息失败:', error);
            throw error;
        }
    }

    /**
     * 获取所有任务列表
     * @param {Object} filter - 过滤条件
     * @returns {Promise<Array>} 任务列表
     */
    static async getTasks(filter = {}) {
        try {
            const tasks = await Task.find(filter).sort({ createdAt: -1 });
            return tasks;
        } catch (error) {
            logger.error('获取任务列表失败:', error);
            throw error;
        }
    }

    /**
     * 删除任务
     * @param {string} id - 任务ID
     * @returns {Promise<Object>} 删除结果
     */
    static async deleteTask(id) {
        try {
            const result = await Task.findByIdAndDelete(id);
            if (!result) {
                throw new Error(`任务ID ${id} 不存在`);
            }
            return result;
        } catch (error) {
            logger.error('删除任务失败:', error);
            throw error;
        }
    }

    /**
     * 清空所有任务
     * @returns {Promise<Object>} 清空结果
     */
    static async clearTasks() {
        try {
            const result = await Task.deleteMany({});
            return result;
        } catch (error) {
            logger.error('清空任务数据失败:', error);
            throw error;
        }
    }

}

export default TaskDB;