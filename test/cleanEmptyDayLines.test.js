import MongoDB from '../database/mongo.js';
import { Stock } from '../database/models/list.js';
import logger from '../utils/logger.js';

/**
 * 测试文件：清除 StockList 集合中 dayLine 为空的记录
 * 此测试文件无需交互确认，直接执行清除操作
 */
async function testCleanEmptyDayLines() {
  try {
    // 连接数据库
    await MongoDB.connect();
    
    logger.info('测试开始：清除 dayLine 为空的股票记录...');
    
    // 查找 dayLine 为空或长度为 0 的记录
    const emptyStocks = await Stock.find({
      $or: [
        { dayLine: { $exists: false } },
        { dayLine: null },
        { dayLine: { $size: 0 } }
      ]
    }, { code: 1, name: 1 });
    
    logger.info(`找到 ${emptyStocks.length} 条 dayLine 为空的股票记录`);
    
    if (emptyStocks.length === 0) {
      logger.info('没有发现 dayLine 为空的股票记录，无需清除');
      return;
    }
    
    // 打印将被清除的股票代码
    logger.info('以下股票的 dayLine 为空，将被清除:');
    for (const stock of emptyStocks) {
      logger.info(`${stock.code} - ${stock.name || '未知'}`);
    }
    
    // 直接执行清除操作，无需确认
    const result = await Stock.deleteMany({
      $or: [
        { dayLine: { $exists: false } },
        { dayLine: null },
        { dayLine: { $size: 0 } }
      ]
    });
    
    logger.info(`成功清除 ${result.deletedCount} 条记录`);
    logger.info('测试完成');
    
  } catch (error) {
    logger.error('测试失败:', error);
    throw error;
  }
}

// 执行测试函数
testCleanEmptyDayLines()
  .then(() => {
    logger.info('测试脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('测试脚本执行失败:', error);
    process.exit(1);
  });