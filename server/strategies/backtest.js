/**
 * 回测执行模块
 */
import MongoDB from '../database/mongo.js';
import { calculateTransactions } from './calculate/signal.js';
import logger from '~/utils/logger.js';
class BacktestExecutor {
  /**
   * 执行单个标的回测
   * @param {string} symbol 标的代码
   * @returns {Promise<Object>} 回测结果
   */
  async backtestSingle(symbol) {
    try {
      // 获取数据
      const stock = await MongoDB.getStock(symbol);
      // 计算交易信息
      const transactions = calculateTransactions(stock)
      // 保存交易信息数据
      await MongoDB.saveTransaction(symbol, transactions);

      return {
        symbol,
        success: true,
        message: `成功计算并保存${symbol}的技术指标数据`
      };
    } catch (error) {
      return {
        symbol,
        success: false,
        message: error.message
      };
    }
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
    await MongoDB.clearTransaction();
        
    // 获取股票列表
    const stockList = await MongoDB.getList();
    
    // 对每个股票执行回测策略
    for (let i = 0; i < stockList.length; i++) {
        const stock = stockList[i];
        logger.info(`开始对第 ${i+1}/${stockList.length} 个股票 ${stock.code} 执行回测策略...`);
        
        // 使用BacktestExecutor执行单个股票回测
        const result = await this.backtestSingle(stock.code);
        if (result.success) {
            logger.info(`第 ${i+1}/${stockList.length} 个股票 ${stock.code} ${result.message}`);
        } else {
            logger.error(`第 ${i+1}/${stockList.length} 个股票 ${stock.code} 回测失败: ${result.message}`);
        }
    }
  }
}

export default BacktestExecutor;