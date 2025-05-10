/**
 * 回测报告模块
 */
import { Report } from '../database/models/report.js';
import { Signal } from '../database/models/signal.js';
import logger from '../utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

class BacktestReport {
  /**
   * 生成回测报告
   * @param {Object} backtestResult 回测结果
   * @returns {Object} 回测报告
   */
  async generateReport() {
    try {
      // 获取该股票的所有交易信号
      const signals = await Signal.find();
      
      if (signals.length === 0) {
        logger.info(`股票 ${stockCode} (${stockName || '未知'}) 没有交易信号，跳过...`);
        return null;
      }
      
      
      const report = this.calculateReport(signals);
      
      // 保存到数据库
      try {
        // 计算报告指标
        const savedReport = await Report.create(report);
        return savedReport;
      } catch (error) {
        logger.error(`保存回测报告失败:`, error);
        return null;
      }
    } catch (error) {
      logger.error(`生成回测报告时发生错误:`, error);
      return null;
    }
  }

  /**
   * 计算交易信号的报告指标
   * @param {Array} signals - 交易信号数组
   * @returns {Object} - 报告对象
   */
  calculateReport(signals) {
    // 基础统计
    const totalSignals = signals.length;
    if (totalSignals === 0) {
      return {
        totalSignals: 0,
        profitableSignals: 0,
        lossSignals: 0,
        avgProfit: 0,
        totalProfit: 0,
        avgHoldingDays: 0,
        successRate: 0
      };
    }
    
    // 筛选有盈亏数据的信号
    const validSignals = signals.filter(signal => 
      signal.profit !== undefined && signal.profit !== null
    );
    
    // 分类统计
    const profitableSignals = validSignals.filter(signal => signal.profit >= 0).length;
    const lossSignals = validSignals.filter(signal => signal.profit < 0).length;
    
    // 计算总盈利和平均盈利
    const totalProfit = validSignals.reduce((sum, signal) => sum + signal.profit, 0);
    const avgProfit = validSignals.length > 0 ? totalProfit / validSignals.length : 0;
    
    // 计算平均持仓天数
    const holdingDays = validSignals
      .filter(signal => signal.buyTime && signal.sellTime)
      .map(signal => {
        const buyDate = new Date(signal.buyTime);
        const sellDate = new Date(signal.sellTime);
        return Math.round((sellDate - buyDate) / (1000 * 60 * 60 * 24));
      });
      
    const avgHoldingDays = holdingDays.length > 0 
      ? holdingDays.reduce((sum, days) => sum + days, 0) / holdingDays.length 
      : 0;
    
    // 计算成功率
    const successRate = validSignals.length > 0 
      ? (profitableSignals / validSignals.length) * 100 
      : 0;
    
    // 返回报告对象
    return {
      totalSignals,
      profitableSignals,
      lossSignals,
      avgProfit,
      totalProfit,
      avgHoldingDays,
      successRate
    };
  }

  /**
   * 从数据库获取交易信号
   * @param {string} stockCode - 股票代码
   * @returns {Promise<Array>} 交易信号数组
   */
  async getSignalsByStockCode(stockCode) {
    try {
      const signals = await Signal.find();
      return signals;
    } catch (error) {
      logger.error(`获取股票 ${stockCode} 交易信号失败:`, error);
      return [];
    }
  }
}
export default BacktestReport;