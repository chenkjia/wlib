/**
 * 回测执行模块
 */
const MongoDB = require('../database/mongo');
const { calculateMetric } = require('./metric');

class BacktestExecutor {
  /**
   * 执行单个标的回测
   * @param {string} symbol 标的代码
   * @returns {Promise<Object>} 回测结果
   */
  async backtestSingle(symbol) {
    try {
      // 获取日线数据
      const dayLine = await MongoDB.getDayLine(symbol);
      // 清理指标数据
      await MongoDB.clearMetric(symbol);

      // 计算技术指标
      const metrics = calculateMetric(dayLine);

      // 保存指标数据
      await MongoDB.saveMetric(symbol, metrics);

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
    // TODO: 实现所有标的回测逻辑
  }
}

module.exports = BacktestExecutor;