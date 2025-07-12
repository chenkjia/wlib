import { dayLineFormat, calculateGoals as calculateGoalsUtil } from '../../utils/stockUtils.js';

/**
 * 计算所有目标趋势
 * @param {Object} data - 股票数据
 * @param {Array} data.dayLine - 日线数据
 * @returns {Array} 所有目标列表
 */
function calculateGoals({ dayLine }) {
  // 使用默认趋势区间14天，斜率阈值0.5
  const formattedDayLine = dayLineFormat(dayLine, 14, 0.5);
  // 使用默认过滤器值0，斜率阈值0.5，窗口大小14
  console.log(dayLine.length)
  const result = calculateGoalsUtil(formattedDayLine);
  console.log(result)
  return result
}

export {
  calculateGoals
};