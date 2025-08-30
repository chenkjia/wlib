import cron from 'node-cron';
import logger from '~/utils/logger.js';

/**
 * 定时任务调度器模块
 * 负责管理和执行系统的定时任务
 */

// 存储所有定时任务的Map
const tasks = new Map();

/**
 * 启动调度器
 * @returns {Promise<void>} 调度器启动完成的Promise
 */
async function startScheduler() {
    logger.info('定时任务调度器启动');
    return Promise.resolve();
}

/**
 * 添加定时任务
 * @param {string} taskName - 任务名称
 * @param {string} cronExpression - cron表达式
 * @param {Function} taskFunction - 要执行的任务函数
 * @returns {Promise<void>} 任务添加完成的Promise
 */
async function addTask(taskName, cronExpression, taskFunction) {
    try {
        // 如果任务已存在，先移除
        if (tasks.has(taskName)) {
            await removeTask(taskName);
        }

        // 创建新的定时任务
        const task = cron.schedule(cronExpression, async () => {
            logger.info(`开始执行定时任务: ${taskName}`);
            try {
                await taskFunction();
                logger.info(`定时任务执行完成: ${taskName}`);
            } catch (error) {
                logger.error(`定时任务执行失败: ${taskName}`, error);
            }
        }, {
            scheduled: false, // 创建时不自动启动
            timezone: 'Asia/Shanghai' // 设置时区为中国时区
        });

        // 存储任务信息
        tasks.set(taskName, {
            task,
            cronExpression,
            taskFunction,
            status: 'stopped',
            createdAt: new Date()
        });

        // 启动任务
        task.start();
        tasks.get(taskName).status = 'running';

        logger.info(`定时任务添加成功: ${taskName}, cron: ${cronExpression}`);
    } catch (error) {
        logger.error(`添加定时任务失败: ${taskName}`, error);
        throw error;
    }
}

/**
 * 移除定时任务
 * @param {string} taskName - 任务名称
 * @returns {Promise<void>} 任务移除完成的Promise
 */
async function removeTask(taskName) {
    try {
        if (tasks.has(taskName)) {
            const taskInfo = tasks.get(taskName);
            taskInfo.task.stop();
            taskInfo.task.destroy();
            tasks.delete(taskName);
            logger.info(`定时任务移除成功: ${taskName}`);
        } else {
            logger.warn(`定时任务不存在: ${taskName}`);
        }
    } catch (error) {
        logger.error(`移除定时任务失败: ${taskName}`, error);
        throw error;
    }
}

/**
 * 暂停定时任务
 * @param {string} taskName - 任务名称
 * @returns {Promise<void>} 任务暂停完成的Promise
 */
async function pauseTask(taskName) {
    try {
        if (tasks.has(taskName)) {
            const taskInfo = tasks.get(taskName);
            taskInfo.task.stop();
            taskInfo.status = 'paused';
            logger.info(`定时任务暂停成功: ${taskName}`);
        } else {
            throw new Error(`定时任务不存在: ${taskName}`);
        }
    } catch (error) {
        logger.error(`暂停定时任务失败: ${taskName}`, error);
        throw error;
    }
}

/**
 * 恢复定时任务
 * @param {string} taskName - 任务名称
 * @returns {Promise<void>} 任务恢复完成的Promise
 */
async function resumeTask(taskName) {
    try {
        if (tasks.has(taskName)) {
            const taskInfo = tasks.get(taskName);
            taskInfo.task.start();
            taskInfo.status = 'running';
            logger.info(`定时任务恢复成功: ${taskName}`);
        } else {
            throw new Error(`定时任务不存在: ${taskName}`);
        }
    } catch (error) {
        logger.error(`恢复定时任务失败: ${taskName}`, error);
        throw error;
    }
}

/**
 * 获取所有定时任务状态
 * @returns {Promise<Array>} 任务状态列表
 */
async function getTaskStatus() {
    const statusList = [];
    for (const [taskName, taskInfo] of tasks) {
        statusList.push({
            name: taskName,
            cronExpression: taskInfo.cronExpression,
            status: taskInfo.status,
            createdAt: taskInfo.createdAt
        });
    }
    return statusList;
}

export {
    startScheduler,
    addTask,
    removeTask,
    pauseTask,
    resumeTask,
    getTaskStatus
};