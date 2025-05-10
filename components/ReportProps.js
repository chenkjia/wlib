/**
 * 交易信号报告组件的Props定义
 */
export const reportProps = {
  totalSignals: { type: Number, default: 0 },         // 信号总数
  profitableSignals: { type: Number, default: 0 },    // 盈利信号数
  lossSignals: { type: Number, default: 0 },          // 亏损信号数
  avgProfit: { type: Number, default: 0 },            // 平均盈利百分比
  totalProfit: { type: Number, default: 0 },          // 总盈利百分比
  avgHoldingDays: { type: Number, default: 0 },       // 平均持仓天数
  successRate: { type: Number, default: 0 }           // 成功率
} 