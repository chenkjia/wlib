/**
 * 目标执行模块
 */
import MongoDB from '../database/mongo.js';
import { calculateGoals } from './calculate/goal.js';
import logger from '../utils/logger.js';

class GoalExecutor {
  /**
   * 执行单个标的目标计算
   * @param {string} symbol 标的代码
   * @returns {Promise<Object>} 执行结果
   */
  async executeGoalSingle(symbol) {
    try {
      // 获取数据
      const stock = await MongoDB.getStock(symbol);
      // 计算目标信息
      const goals = calculateGoals(stock);
      console.log(goals)
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
  async executeGoalMultiple(symbols) {
    const results = [];
    for (let i = 0; i < symbols.length; i++) {
      const symbol = symbols[i];
      logger.info(`开始对第 ${i+1}/${symbols.length} 个股票 ${symbol} 执行目标计算...`);
      
      const result = await this.executeGoalSingle(symbol);
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
    // 清空现有目标数据（如果需要）
    if (options.clearExisting !== false) {
      await MongoDB.clearGoal();
    }
    
    // 获取股票列表
    const stockList = await MongoDB.getList();
    
    // 对每个股票执行目标计算
    const results = [];
    for (let i = 0; i < stockList.length; i++) {
      const stock = stockList[i];
      logger.info(`开始对第 ${i+1}/${stockList.length} 个股票 ${stock.code} 执行目标计算...`);
      
      // 使用GoalExecutor执行单个股票目标计算
      const result = await this.executeGoalSingle(stock.code);
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