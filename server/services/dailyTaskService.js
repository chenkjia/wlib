import { addTask, startScheduler } from './scheduler.js';
import { fetchAllDayLines } from '../fetchers/dayLineFetcher.js';
import { fetchAllHourLines } from '../fetchers/hourLineFetcher.js';
import { updateFocusedStocks } from './focusService.js';
import MongoConnection from '../database/connection.js';
import logger from '~/utils/logger.js';

/**
 * 日常定时任务服务
 * 负责初始化和管理日常的定时任务
 */

/**
 * 初始化所有定时任务
 */
async function initDailyTasks() {
    try {
        // 启动调度器
        await startScheduler();
        
        // 添加每天下午4点半执行的日线数据拉取任务
        // cron表达式: 30 16 * * * 表示每天16:30执行
        await addTask(
            'daily-dayline-fetch',
            '30 16 * * *',
            async () => {
                logger.info('开始执行每日日线数据拉取任务');
                // 确保数据库连接
                await MongoConnection.connect();
                await fetchAllDayLines();
                logger.info('每日日线数据拉取任务完成');
                
                // 日线数据拉取完成后，更新重点关注股票状态
                logger.info('开始更新重点关注股票状态...');
                await updateFocusedStocks();
                logger.info('重点关注股票状态更新完成');
            }
        );
        
        // 添加每小时第5分钟执行的小时线数据拉取任务
        // cron表达式: 5 * * * * 表示每小时的第5分钟执行
        await addTask(
            'hourly-hourline-fetch',
            '5 * * * *',
            async () => {
                logger.info('开始执行每小时小时线数据拉取任务');
                // 确保数据库连接
                await MongoConnection.connect();
                await fetchAllHourLines();
                logger.info('每小时小时线数据拉取任务完成');
            }
        );
        
        logger.info('所有定时任务初始化完成');
    } catch (error) {
        logger.error('初始化定时任务失败:', error);
        throw error;
    }
}

/**
 * 手动执行日线数据拉取
 */
async function manualFetchDayLines() {
    try {
        logger.info('手动执行日线数据拉取');
        // 确保数据库连接
        await MongoConnection.connect();
        await fetchAllDayLines();
        logger.info('手动日线数据拉取完成');
    } catch (error) {
        logger.error('手动日线数据拉取失败:', error);
        throw error;
    }
}

export {
    initDailyTasks,
    manualFetchDayLines
};