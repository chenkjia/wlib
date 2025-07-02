const dayLineFormat = (dayLine, n) => {
  // 计算出dayLine里每个数据的max和min,max为前后n天的high最大值,min为前后n天的low最小值
  const result = dayLine.map((item, i) => {
    const max = Math.max(...dayLine.slice(Math.max(0, i - n), Math.min(dayLine.length, i + n + 1)).map(item => item.high));
    const min = Math.min(...dayLine.slice(Math.max(0, i - n), Math.min(dayLine.length, i + n + 1)).map(item => item.low));
    return {
      ...item,
      max,
      min,
      // 趋势开始
      trendStart: min === item.low,
      // 趋势结束
      trendEnd: max === item.high
    }
  })
  return result
}
/**
 * 计算所有目标趋势
 * @param {Object} data - 股票数据
 * @param {Array} data.dayLine - 日线数据
 * @returns {Array} 所有目标列表
 */
function calculateGoals({ dayLine }) {
  
  return result;
}

export {
  calculateGoals
};