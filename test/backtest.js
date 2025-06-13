import MongoDB from '../server/database/mongo.js';
import logger from '../server/utils/logger.js';
import BacktestExecutor from '../server/strategies/backtest.js';

async function runBacktest() {
    try {
        // 连接数据库
        await MongoDB.connect();
        // 创建回测执行器实例
        const executor = new BacktestExecutor();

        await MongoDB.clearTransaction();
        await executor.backtestAll();
        // const result = await executor.backtestSingle('ETH');
        // console.log(result);
        
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