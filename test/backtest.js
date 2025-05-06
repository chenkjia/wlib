import MongoDB from '../server/database/mongo.js';
import logger from '../server/utils/logger.js';
import BacktestExecutor from '../server/strategies/backtest.js';

async function runBacktest() {
    try {
        // 连接数据库
        await MongoDB.connect();
        
        // 获取股票列表
        const stockList = await MongoDB.getList();
        
        // 创建回测执行器实例
        const executor = new BacktestExecutor();
        
        // 对每个股票执行回测策略
        for (const stock of stockList) {
            logger.info(`开始对 ${stock.code} 执行回测策略...`);
            
            // 使用BacktestExecutor执行单个股票回测
            const result = await executor.backtestSingle(stock.code);
            
            if (result.success) {
                logger.info(`${stock.code} ${result.message}`);
            } else {
                logger.error(`${stock.code} 回测失败: ${result.message}`);
            }
        }
        
        logger.info('所有股票回测完成');
    } catch (error) {
        logger.error('回测执行失败:', error);
        throw error;
    }
}

async function main() {
    try {
        await runBacktest();
    } catch (error) {
        console.error('Error:', error);
    }
}

main();