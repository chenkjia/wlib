import mongoose from 'mongoose';

/**
 * 交易报告的数据模型
 */
const reportSchema = new mongoose.Schema({
  // 基础信息
  stockCode: { type: String, index: true },           // 股票代码（如果是单个股票的报告）
  reportType: { type: String, default: 'overall' },   // 报告类型：overall（总体）或stock（单个股票）
  generatedAt: { type: Date, default: Date.now },     // 报告生成时间
  
  // 交易统计
  totalTransactions: { type: Number, default: 0 },    // 交易总数
  completedTransactions: { type: Number, default: 0 }, // 已完成交易数（买入和卖出都执行）
  profitableTransactions: { type: Number, default: 0 }, // 盈利交易数
  lossTransactions: { type: Number, default: 0 },     // 亏损交易数
  
  // 盈亏统计
  avgProfit: { type: Number, default: 0 },            // 平均盈利
  totalProfit: { type: Number, default: 0 },          // 总盈利
  maxProfit: { type: Number, default: 0 },            // 最大盈利
  maxLoss: { type: Number, default: 0 },              // 最大亏损
  successRate: { type: Number, default: 0 },          // 成功率（盈利交易/有效交易）
  
  // 持仓统计
  avgHoldingDays: { type: Number, default: 0 },       // 平均持仓天数
  
  // 交易金额统计
  avgBuyAmount: { type: Number, default: 0 },         // 平均买入金额
  avgSellAmount: { type: Number, default: 0 },        // 平均卖出金额
  totalBuyAmount: { type: Number, default: 0 },       // 总买入金额
  totalSellAmount: { type: Number, default: 0 },      // 总卖出金额
  
  // 交易成功率
  buySuccessRate: { type: Number, default: 0 },       // 买入成功率
  sellSuccessRate: { type: Number, default: 0 }       // 卖出成功率
});

// 创建复合索引
reportSchema.index({ reportType: 1, generatedAt: -1 });
reportSchema.index({ stockCode: 1, generatedAt: -1 });

const Report = mongoose.model('Report', reportSchema);

export { Report };