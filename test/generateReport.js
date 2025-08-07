import MongoDB from '../server/database/mongo.js';
import BacktestReport from '../server/strategies/report.js';
import logger from '../utils/logger.js';

/**
 * 生成并保存交易报告
 * 统计所有交易记录，不进行分组和时间限制
 */
async function generateReports() {
  try {
    // 连接数据库
    await MongoDB.connect();
    logger.info('数据库连接成功');
    
    // 创建报告生成器实例
    const reportGenerator = new BacktestReport();
    
    // 生成总体报告，不进行分组和时间限制
    logger.info('开始生成交易报告...');
    const report = await reportGenerator.generateReport();
    
    if (report) {
      logger.info('成功生成交易报告');
      
      // 输出报告的关键指标
      logger.info('报告关键指标:');
      logger.info(`- 交易总数: ${report.totalTransactions}`);
      logger.info(`- 已完成交易: ${report.completedTransactions}`);
      logger.info(`- 盈利交易: ${report.profitableTransactions}`);
      logger.info(`- 亏损交易: ${report.lossTransactions}`);
      logger.info(`- 成功率: ${report.successRate.toFixed(2)}%`);
      logger.info(`- 总盈利: ${report.totalProfit.toFixed(2)}`);
      logger.info(`- 平均盈利: ${report.avgProfit.toFixed(2)}`);
      logger.info(`- 最大盈利: ${report.maxProfit.toFixed(2)}`);
      logger.info(`- 最大亏损: ${report.maxLoss.toFixed(2)}`);
      logger.info(`- 平均持仓天数: ${report.avgHoldingDays.toFixed(2)}`);
      logger.info(`- 买入成功率: ${report.buySuccessRate.toFixed(2)}%`);
      logger.info(`- 卖出成功率: ${report.sellSuccessRate.toFixed(2)}%`);
      logger.info(`- 平均买入金额: ${report.avgBuyAmount.toFixed(2)}`);
      logger.info(`- 平均卖出金额: ${report.avgSellAmount.toFixed(2)}`);
      logger.info(`- 总买入金额: ${report.totalBuyAmount.toFixed(2)}`);
      logger.info(`- 总卖出金额: ${report.totalSellAmount.toFixed(2)}`);
    } else {
      logger.warn('没有生成报告，可能没有交易记录');
    }
    
  } catch (error) {
    logger.error('生成报告时发生错误:', error);
    throw error;
  } finally {
    // 关闭数据库连接
    await MongoDB.disconnect();
    logger.info('数据库连接已关闭');
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