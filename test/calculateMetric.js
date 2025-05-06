import MongoDB from '../server/database/mongo.js';
import logger from '../server/utils/logger.js';
import { calculateMetric } from '../server/strategies/metric.js';

async function runBacktest() {
    try {
        // 连接数据库
        await MongoDB.connect();
        
        // 获取股票列表
        const dayLine = await MongoDB.getDayLine('ETH');
        
        console.log(calculateMetric(dayLine))
        
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