import MongoDB from '../server/database/mongo.js';
import BacktestReport from '../server/strategies/report.js';
import logger from '../utils/logger.js';

/**
 * 生成并保存交易报告
 */
async function generateReports() {
  try {
    // 连接数据库
    await MongoDB.connect();
    // 创建报告实例并生成所有报告
    const reporter = new BacktestReport();
    await reporter.generateReport();
    
  } catch (error) {
    logger.error('生成报告时发生错误:', error);
    throw error;
  }
}

// 执行函数
generateReports()
  .then(() => {
    logger.info('报告生成脚本执行完毕');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('报告生成脚本执行失败:', error);
    process.exit(1);
  }); 