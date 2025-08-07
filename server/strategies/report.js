/**
 * 回测报告模块
 * 统计所有交易记录，生成报告并保存到MongoDB
 */
import { Report } from '../database/models/report.js';
import { Transaction } from '../database/models/transaction.js';
import logger from '~/utils/logger.js';
import fs from 'fs/promises';
import path from 'path';

class BacktestReport {
  /**
   * 生成回测报告
   * 统计所有交易记录，不进行分组和时间限制
   * @returns {Object} 回测报告
   */
  async generateReport() {
    try {
      // 获取所有交易记录，不添加任何过滤条件
      const transactions = await Transaction.find();
      
      if (transactions.length === 0) {
        logger.info(`没有交易记录，跳过生成报告...`);
        return null;
      }
      
      logger.info(`找到 ${transactions.length} 条交易记录，开始生成报告...`);
      
      // 计算报告指标
      const report = this.calculateReport(transactions);
      
      // 添加报告元数据
      report.generatedAt = new Date();
      report.reportType = 'overall';
      
      // 保存到数据库
      try {
        const savedReport = await Report.create(report);
        logger.info(`成功生成并保存回测报告，ID: ${savedReport._id}`);
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
   * 计算交易记录的报告指标
   * @param {Array} transactions - 交易记录数组
   * @returns {Object} - 报告对象
   */
  calculateReport(transactions) {
    // 基础统计
    const totalTransactions = transactions.length;
    if (totalTransactions === 0) {
      return {
        totalTransactions: 0,
        completedTransactions: 0,
        profitableTransactions: 0,
        lossTransactions: 0,
        avgProfit: 0,
        totalProfit: 0,
        maxProfit: 0,
        maxLoss: 0,
        avgHoldingDays: 0,
        successRate: 0,
        avgBuyAmount: 0,
        avgSellAmount: 0,
        totalBuyAmount: 0,
        totalSellAmount: 0,
        buySuccessRate: 0,
        sellSuccessRate: 0
      };
    }
    
    // 筛选已完成的交易（买入和卖出都已执行）
    const completedTransactions = transactions.filter(transaction => 
      transaction.buyTime && transaction.sellTime
    );
    
    // 筛选有盈亏数据的交易
    const validTransactions = transactions.filter(transaction => 
      transaction.profit !== undefined && transaction.profit !== null
    );
    
    // 分类统计
    const profitableTransactions = validTransactions.filter(transaction => transaction.profit > 0).length;
    const lossTransactions = validTransactions.filter(transaction => transaction.profit <= 0).length;
    
    // 计算总盈利和平均盈利
    const totalProfit = validTransactions.reduce((sum, transaction) => sum + transaction.profit, 0);
    const avgProfit = validTransactions.length > 0 ? totalProfit / validTransactions.length : 0;
    
    // 计算最大盈利和最大亏损
    const profits = validTransactions.map(transaction => transaction.profit);
    const maxProfit = profits.length > 0 ? Math.max(...profits) : 0;
    const maxLoss = profits.length > 0 ? Math.min(...profits) : 0;
    
    // 计算平均持仓天数
    const holdingDays = completedTransactions
      .map(transaction => {
        const buyDate = new Date(transaction.buyTime);
        const sellDate = new Date(transaction.sellTime);
        return Math.round((sellDate - buyDate) / (1000 * 60 * 60 * 24));
      });
      
    const avgHoldingDays = holdingDays.length > 0 
      ? holdingDays.reduce((sum, days) => sum + days, 0) / holdingDays.length 
      : 0;
    
    // 计算成功率
    const successRate = validTransactions.length > 0 
      ? (profitableTransactions / validTransactions.length) * 100 
      : 0;
    
    // 计算买入和卖出成功率
    const buyAttempts = transactions.filter(transaction => transaction.buyTime).length;
    const buySuccesses = transactions.filter(transaction => transaction.isBuySuccess).length;
    const sellAttempts = transactions.filter(transaction => transaction.sellTime).length;
    const sellSuccesses = transactions.filter(transaction => transaction.isSellSuccess).length;
    
    const buySuccessRate = buyAttempts > 0 ? (buySuccesses / buyAttempts) * 100 : 0;
    const sellSuccessRate = sellAttempts > 0 ? (sellSuccesses / sellAttempts) * 100 : 0;
    
    // 计算平均交易金额
    const totalBuyAmount = transactions.reduce((sum, transaction) => sum + (transaction.buyAmount || 0), 0);
    const totalSellAmount = transactions.reduce((sum, transaction) => sum + (transaction.sellAmount || 0), 0);
    
    const avgBuyAmount = buyAttempts > 0 ? totalBuyAmount / buyAttempts : 0;
    const avgSellAmount = sellAttempts > 0 ? totalSellAmount / sellAttempts : 0;
    
    // 返回报告对象
    return {
      totalTransactions,
      completedTransactions: completedTransactions.length,
      profitableTransactions,
      lossTransactions,
      avgProfit,
      totalProfit,
      maxProfit,
      maxLoss,
      avgHoldingDays,
      successRate,
      avgBuyAmount,
      avgSellAmount,
      totalBuyAmount,
      totalSellAmount,
      buySuccessRate,
      sellSuccessRate
    };
  }

  /**
   * 从数据库获取交易记录
   * @param {string} stockCode - 股票代码
   * @returns {Promise<Array>} 交易记录数组
   */
  async getTransactionsByStockCode(stockCode) {
    try {
      const transactions = await Transaction.find({ stockCode });
      return transactions;
    } catch (error) {
      logger.error(`获取股票 ${stockCode} 交易记录失败:`, error);
      return [];
    }
  }
}
export default BacktestReport;