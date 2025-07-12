import { dayLineFormat, calculateGoals as calculateGoalsUtil } from '../../utils/stockUtils.js';

/**
 * 计算所有目标趋势
 * @param {Object} data - 股票数据
 * @param {Array} data.dayLine - 日线数据
 * @returns {Array} 所有目标列表
 */
function calculateGoals({ dayLine }, profitFilter = 0, dailyProfitFilter = 0, slopeThreshold = 0.5, trendInterval = 14, durationFilter = 0, liquidityFilter = 0) {
  // 使用指定的趋势区间和斜率阈值
  const formattedDayLine = dayLineFormat(dayLine, trendInterval, slopeThreshold);
  // 使用指定的过滤器值、斜率阈值、窗口大小、持续时间过滤器和流动性过滤器
  console.log(`处理 ${dayLine.length} 条日线数据，参数：趋势区间=${trendInterval}，斜率阈值=${slopeThreshold}，利润过滤器=${profitFilter}，日均利润过滤器=${dailyProfitFilter}，持续时间过滤器=${durationFilter}，流动性过滤器=${liquidityFilter}`);
  const result = calculateGoalsUtil(formattedDayLine, profitFilter, dailyProfitFilter, slopeThreshold, trendInterval, durationFilter, liquidityFilter);
  console.log(`计算出 ${result.length} 个目标趋势`);
  return result;
}

export {
  calculateGoals
};