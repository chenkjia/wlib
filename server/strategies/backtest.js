/**
 * 回测执行模块
 */
import MongoDB from '../database/mongo.js';
import { calculateStock } from '~/utils/chartUtils.js';
import logger from '~/utils/logger.js';
class BacktestExecutor {
  /**
   * 执行单个标的回测
   * @param {string} symbol 标的代码
   * @returns {Promise<Object>} 回测结果
   */
  async backtestSingle(symbol, strategy) {
      const stock = await MongoDB.getStock(symbol);
      const { backtestData } = calculateStock({
        dayLine: stock.dayLine,
        hourLine: stock.hourLine,
        ...strategy
      });
      return backtestData;
  }

  /**
   * 执行多个标的回测
   * @param {string[]} symbols 标的代码列表
   * @returns {Promise<Object[]>} 回测结果列表
   */
  async backtestMultiple(symbols) {
    // TODO: 实现多个标的回测逻辑
  }

  /**
   * 执行所有标的回测
   * @param {Object} strategy 策略配置
   * @returns {Promise<Object[]>} 回测结果列表
   */
  async backtestAll(strategy) {
    // 获取股票列表
    // const stockList = await MongoDB.getAll();

    const stocks = ['AAVE', 'ETH', 'AE', 'SFL', 'BAT', 'CET', 'CMT'];
    const stockList = stocks.map(symbol => ({ code: symbol }));
    console.log(stockList.length);
    const backtestResults = [];
    // 对每个股票执行回测策略
    for (let i = 0; i < stockList.length; i++) {
        const stock = stockList[i];
        logger.info(`开始对第 ${i+1}/${stockList.length} 个股票 ${stock.code} 执行回测策略...`);
        
        // 使用BacktestExecutor执行单个股票回测
        const backtestData = await this.backtestSingle(stock.code, strategy);
        backtestResults.push(backtestData);
        logger.info(`第 ${i+1}/${stockList.length} 个股票 ${stock.code} 回测完成`);
    }
    // 需要统计回测结果
    const stockCount = backtestResults.length;
    if (stockCount === 0) {
      return { success: false, message: '没有可用的回测结果' };
    }
    
    // 统计字段名称
    const statFields = [
      'totalTrades',        // 交易笔数
      'profitTrades',       // 盈利笔数
      'lossTrades',         // 亏损笔数
      'daysDuration',       // 交易总天数
      'priceChange',        // 交易总涨跌幅
      'dailyChange',        // 交易日均涨跌幅
      'maxDrawdown',        // 最大回撤
      'dayLineCount',       // 日线总数
      'dayLinePriceChange', // 日线总涨跌幅
      'dayLineDailyChange',  // 日线日均涨跌幅
      'priceChangeDiff',
      'dailyChangeDiff',
    ];
    
    // 初始化统计数组
    const sums = Array(statFields.length).fill(0);
    
    // 累加所有股票的统计数据
    for (const result of backtestResults) {
      if (!result) continue;
      
      statFields.forEach((field, index) => {
        sums[index] += result[field] || 0;
      });
    }
    
    // 计算平均值
    const stats = {};
    statFields.forEach((field, index) => {
      stats[field] = sums[index] / stockCount;
    });
    
    // 计算胜率和比率
    stats.winRate = stats.profitTrades / (stats.totalTrades || 1);
 
    return stats;
  }
}

export default BacktestExecutor;