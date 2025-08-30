#!/usr/bin/env node

/**
 * 手动执行日线数据拉取脚本
 * 用于手动触发所有加密货币的日线数据更新
 */

import { manualFetchDayLines as originalManualFetchDayLines } from '../services/dailyTaskService.js';
import logger from '~/utils/logger.js';

/**
 * 显示帮助信息
 */
function showHelp() {
    console.log(`
日线数据拉取工具
`);
    console.log('用法:');
    console.log('  npm run fetch:daylines [选项]\n');
    console.log('选项:');
    console.log('  -h, --help     显示此帮助信息');
    console.log('  --force        强制更新所有数据（忽略时间检查）\n');
    console.log('示例:');
    console.log('  npm run fetch:daylines        # 正常执行日线数据拉取');
    console.log('  npm run fetch:daylines --help # 显示帮助信息');
    console.log('  npm run fetch:daylines --force # 强制更新所有数据\n');
}

/**
 * 手动执行日线数据拉取
 */
async function manualFetchDayLines(force = false) {
    try {
        logger.info('开始手动执行日线数据拉取');
        
        // 执行日线数据拉取
        await originalManualFetchDayLines();
        
        logger.info('手动日线数据拉取完成');
        console.log('✅ 日线数据拉取成功完成');
        
    } catch (error) {
        logger.error('手动日线数据拉取失败:', error);
        console.error('❌ 日线数据拉取失败:', error.message);
        process.exit(1);
    }
}

// 主程序
async function main() {
    const args = process.argv.slice(2);
    
    // 检查帮助参数
    if (args.includes('-h') || args.includes('--help')) {
        showHelp();
        return;
    }
    
    // 检查强制更新参数
    const force = args.includes('--force');
    
    try {
        await manualFetchDayLines(force);
    } catch (error) {
        console.error('执行失败:', error.message);
        process.exit(1);
    }
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

// 导出函数供其他模块使用
export { manualFetchDayLines };

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('脚本执行失败:', error);
        process.exit(1);
    });
}