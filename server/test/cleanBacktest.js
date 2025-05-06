const MongoDB = require('../src/database/mongo');
const logger = require('../src/utils/logger');

async function cleanBacktestData() {
    try {
        // 连接数据库
        await MongoDB.connect();
        
        // 获取股票列表
        const stockList = await MongoDB.getList();
        
        // 清理每个股票的指标和信号数据
        for (const stock of stockList) {
            logger.info(`开始清理 ${stock.code} 的回测数据...`);
            
            // 清空指标数据
            await MongoDB.updateDayMetrics(stock.code, []);
            await MongoDB.updateHourMetrics(stock.code, []);
            
            // 清空信号数据
            await MongoDB.updateSignals(stock.code, []);
            
            logger.info(`${stock.code} 回测数据清理完成`);
        }
        
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