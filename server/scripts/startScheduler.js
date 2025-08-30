#!/usr/bin/env node

/**
 * 定时任务启动脚本
 * 用于启动所有定时任务
 */

import { initDailyTasks } from '../services/dailyTaskService.js';
import { getTaskStatus } from '../services/scheduler.js';
import logger from '~/utils/logger.js';

// 处理命令行参数
const args = process.argv.slice(2);
const showHelp = args.includes('--help') || args.includes('-h');
const showStatus = args.includes('--status') || args.includes('-s');

if (showHelp) {
    console.log(`
定时任务管理工具

用法:
  node scripts/startScheduler.js [选项]

选项:
  -h, --help     显示帮助信息
  -s, --status   显示当前任务状态

示例:
  node scripts/startScheduler.js
  npm run scheduler:start
  npm run scheduler:status
`);
    process.exit(0);
}

// 显示任务状态
async function showTaskStatus() {
    try {
        const tasks = await getTaskStatus();
        console.log('\n=== 定时任务状态 ===\n');
        
        if (tasks.length === 0) {
            console.log('暂无运行中的定时任务');
        } else {
            tasks.forEach(task => {
                console.log(`任务名称: ${task.name}`);
                console.log(`Cron表达式: ${task.cronExpression}`);
                console.log(`状态: ${task.status}`);
                console.log(`创建时间: ${task.createdAt.toLocaleString('zh-CN')}`);
                console.log('---');
            });
        }
        console.log();
    } catch (error) {
        console.error('获取任务状态失败:', error.message);
        logger.error('获取任务状态失败:', error);
    }
}

// 主执行函数
async function main() {
    try {
        if (showStatus) {
            await showTaskStatus();
            return;
        }
        
        console.log('\n=== 定时任务调度器 ===\n');
        
        logger.info('正在启动定时任务调度器...');
        console.log('🚀 正在启动定时任务调度器...');
        
        await initDailyTasks();
        
        console.log('✅ 定时任务调度器启动成功！');
        console.log('📅 每日16:30将自动执行日线数据拉取');
        console.log('\n按 Ctrl+C 停止调度器\n');
        
        // 显示当前任务状态
        await showTaskStatus();
        
        // 保持进程运行
        setInterval(() => {
            // 每小时输出一次心跳日志
        }, 3600000);
        
    } catch (error) {
        console.error('\n❌ 启动定时任务调度器失败:', error.message);
        logger.error('启动定时任务调度器失败:', error);
        process.exit(1);
    }
}

// 处理未捕获的异常
process.on('unhandledRejection', (reason, promise) => {
    logger.error('未处理的Promise拒绝:', reason);
    console.error('\n❌ 发生未处理的错误:', reason);
});

process.on('uncaughtException', (error) => {
    logger.error('未捕获的异常:', error);
    console.error('\n❌ 发生未捕获的异常:', error.message);
});

// 处理Ctrl+C中断
process.on('SIGINT', () => {
    console.log('\n\n⚠️  正在停止定时任务调度器...');
    logger.info('用户停止定时任务调度器');
    console.log('✅ 定时任务调度器已停止');
    process.exit(0);
});

// 执行主函数
main();