/**
 * 目标执行模块
 */
import MongoDB from '../database/mongo.js';
import { calculateGoals } from '~/utils/stockUtils.js';
import logger from '~/utils/logger.js';

class GoalExecutor {
  /**
   * 执行单个标的目标计算
   * @param {string} symbol 标的代码
   * @returns {Promise<Object>} 执行结果
   */
  async executeGoalSingle(symbol, options = {}) {
    try {
      // 获取数据
      const stock = await MongoDB.getStock(symbol);
      
      // 从选项中提取参数，如果没有则使用默认值
      const {
        profitFilter =50,           // 利润过滤器值
        dailyProfitFilter = 2,      // 日均利润过滤器值
        slopeThreshold= 0.5,       // 斜率阈值
        trendInterval= 40,         // 趋势区间
        durationFilter= 7,         // 持续时间过滤器值
        liquidityFilter= 50000   
      } = options;
      // 计算目标信息，传递所有参数
      const goals = calculateGoals(
        stock.dayLine.map(item => ({
          time: item.time,
          close: item.close,
          high: item.high,
          low: item.low,
          volume: item.volume,
          amount: item.amount
        })),
        profitFilter,
        dailyProfitFilter,
        slopeThreshold,
        trendInterval,
        durationFilter,
        liquidityFilter
      );
      
      console.log(`${symbol} 计算出 ${goals.length} 个目标趋势`);
      
      // 保存目标信息数据
      await MongoDB.saveGoal(symbol, goals);

      return {
        symbol,
        success: true,
        message: `成功计算并保存${symbol}的目标数据`,
        goalCount: goals.length
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
   * 执行多个标的目标计算
   * @param {string[]} symbols 标的代码列表
   * @returns {Promise<Object[]>} 执行结果列表
   */
  async executeGoalMultiple(symbols, options = {}) {
    const results = [];
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      logger.info(`开始对第 ${i+1}/${symbols.length} 个股票 ${symbol} 执行目标计算...`);
      
      const result = await this.executeGoalSingle(symbol, options);
      results.push(result);
      
      if (result.success) {
        logger.info(`第 ${i+1}/${symbols.length} 个股票 ${symbol} ${result.message}`);
      } else {
        logger.error(`第 ${i+1}/${symbols.length} 个股票 ${symbol} 目标计算失败: ${result.message}`);
      }
    }
    
    return results;
  }

  /**
   * 执行所有标的目标计算
   * @param {Object} options 执行选项
   * @returns {Promise<Object[]>} 执行结果列表
   */
  async executeGoalAll(options = {}) {
    await MongoDB.clearGoal();
    // 获取股票列表
    const stockList = await MongoDB.getAll();
    // 提取计算参数，其余参数保留在cleanOptions中
    
    console.log(stockList.length)
    // 对每个股票执行目标计算
    const results = [];
    for (let i = 0; i < stockList.length; i++) {
      const stock = stockList[i];
      console.log(stock.code)
      logger.info(`开始对第 ${i+1}/${stockList.length} 个股票 ${stock.code} 执行目标计算...`);
      
      // 使用GoalExecutor执行单个股票目标计算，传递计算参数
      const result = await this.executeGoalSingle(stock.code, options);
      results.push(result);
      if (result.success) {
        logger.info(`第 ${i+1}/${stockList.length} 个股票 ${stock.code} ${result.message}`);
      } else {
        logger.error(`第 ${i+1}/${stockList.length} 个股票 ${stock.code} 目标计算失败: ${result.message}`);
      }
    }
    
    return results;
  }
  
  /**
   * 更新目标状态
   * @param {string} goalId 目标ID
   * @param {Object} updateData 更新数据
   * @returns {Promise<Object>} 更新结果
   */
  async updateGoalStatus(goalId, updateData) {
    try {
      const updatedGoal = await MongoDB.updateGoal(goalId, updateData);
      return {
        goalId,
        success: true,
        message: '目标状态更新成功',
        goal: updatedGoal
      };
    } catch (error) {
      return {
        goalId,
        success: false,
        message: error.message
      };
    }
  }
}

export default GoalExecutor;