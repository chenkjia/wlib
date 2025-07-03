/**
 * 股票数据处理工具函数
 * 用于前端和服务器端共享的股票数据处理函数
 */

/**
 * 格式化日线数据，添加趋势标记
 * @param {Array} dayLine - 日线数据
 * @param {Number} n - 趋势区间天数
 * @returns {Array} 格式化后的日线数据
 */
export const dayLineFormat = (dayLine, n) => {
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
 * 计算目标趋势
 * @param {Array} dayLine - 格式化后的日线数据
 * @param {Number} profitFilter - 利润过滤器值，低于此值的趋势将被过滤
 * @param {Number} dailyProfitFilter - 日均利润过滤器值，低于此值的趋势将被过滤
 * @returns {Array} 目标趋势列表
 */
export const calculateGoals = (dayLine, profitFilter = 0, dailyProfitFilter = 0) => {
  const tmp = dayLine.filter(item => item.trendStart || item.trendEnd)
  const goals = tmp.reduce((result, item, index) => {
    const next = tmp[index + 1]
    if (item.trendStart && next && next.trendEnd) {
      const duration = (new Date(next.time).getTime() - new Date(item.time).getTime()) / (1000 * 60 * 60 * 24)
      const profit = (next.high - item.low) / item.low * 100
      const dailyProfit = profit / duration
      
      // 应用过滤器：如果利润或日均利润小于过滤器值，则跳过此项
      if (profit < profitFilter || dailyProfit < dailyProfitFilter) {
        return result
      }
      
      return [
        ...result,
        {
          startPrice: item.low,
          endPrice: next.high,
          goalType: item.low < next.high ? 'buy' : 'sell',
          startTime: item.time,
          endTime: next.time,
          profit,
          // 计算duration,time是Date格式,需要转换为毫秒
          duration,
          // 日均涨幅
          dailyProfit,
        }
      ]
    }
    return result
  }, [])
  
  return goals.map((goal, index) => { 
    return {...goal, index }
  });
}