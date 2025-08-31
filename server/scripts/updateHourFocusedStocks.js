#!/usr/bin/env node

import { updateHourFocusedStocks } from '../services/focusService.js';
import MongoConnection from '../database/connection.js';
import logger from '~/utils/logger.js';

/**
 * 更新小时线重点关注股票状态的命令行工具
 */

/**
 * 显示帮助信息
 */
function showHelp() {
    console.log(`
小时线重点关注股票更新工具

用法:
  npm run update:hour-focused [选项]

选项:
  -h, --help     显示此帮助信息

示例:
  npm run update:hour-focused        # 更新小时线重点关注股票状态
  npm run update:hour-focused --help # 显示帮助信息
`);
}

/**
 * 手动执行更新小时线重点关注股票状态
 */
async function manualUpdateHourFocusedStocks() {
    try {
        // 1. 确保数据库连接
        await MongoConnection.connect();
        logger.info('数据库连接成功');
        
        // 2. 调用updateHourFocusedStocks函数
        const result = await updateHourFocusedStocks();
        
        // 3. 处理结果
        console.log('\n=== 更新结果 ===');
        console.log(`总共处理股票: ${result.totalProcessed} 只`);
        console.log(`小时线重点关注股票: ${result.hourFocusedCount} 只`);
        console.log(`数据库更新: 重置${result.updateResult.resetCount}只，设置${result.updateResult.focusedCount}只为小时线重点关注`);
        console.log('\n小时线重点关注股票状态更新完成！');
        
    } catch (error) {
        logger.error('手动更新小时线重点关注股票状态失败:', error);
        process.exit(1);
    } finally {
        // 断开数据库连接
        await MongoConnection.disconnect();
    }
}

/**
 * 主程序
 */
async function main() {
    const args = process.argv.slice(2);
    
    // 检查帮助参数
    if (args.includes('-h') || args.includes('--help')) {
        showHelp();
        return;
    }
    
    await manualUpdateHourFocusedStocks();
}

// 处理进程中断
process.on('SIGINT', () => {
    console.log('\n收到中断信号，正在退出...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n收到终止信号，正在退出...');
    process.exit(0);
});

// 执行主程序
main().catch(error => {
    logger.error('程序执行失败:', error);
    process.exit(1);
});

export { manualUpdateHourFocusedStocks };