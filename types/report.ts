/**
 * 交易信号报告类型定义
 */
export interface Report {
  totalSignals: number;         // 信号总数
  profitableSignals: number;    // 盈利信号数
  lossSignals: number;          // 亏损信号数
  avgProfit: number;            // 平均盈利百分比
  totalProfit: number;          // 总盈利百分比
  avgHoldingDays: number;       // 平均持仓天数
  successRate: number;          // 成功率
}

/**
 * 创建默认的空报告对象
 */
export function createEmptyReport(): Report {
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