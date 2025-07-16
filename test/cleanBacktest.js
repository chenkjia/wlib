import MongoDB from '../server/database/mongo.js';
import logger from '../utils/logger.js';

async function cleanBacktestData() {
    try {
        // 连接数据库
        await MongoDB.connect();
        
        // 获取股票列表
        await MongoDB.clearSignal();
        await MongoDB.clearTransaction();
        
        
        logger.info('所有股票的回测数据清理完成');
    } catch (error) {
        logger.error('回测数据清理失败:', error);
        throw error;
    }
}

async function main() {
    try {
        await cleanBacktestData();
    } catch (error) {
        console.error('Error:', error);
    }
}

main();