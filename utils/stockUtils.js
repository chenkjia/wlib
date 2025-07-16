/**
 * 股票数据处理工具函数
 * 用于前端和服务器端共享的股票数据处理函数
 */

/**
 * 格式化日线数据，添加趋势标记
 * @param {Array} dayLine - 日线数据
 * @param {Number} n - 趋势区间天数
 * @param {Number} slopeThreshold - 斜率阈值，用于斜率分析法，默认为0.5
 * @returns {Array} 格式化后的日线数据
 */
const dayLineFormat = (dayLine, n = 40, slopeThreshold = 0.5) => {

  if (!dayLine || dayLine.length === 0) {
    return [];
  }
  // 计算出dayLine里每个数据的max和min,max为前后n天的high最大值,min为前后n天的low最小值
  const result = dayLine.map((item, i) => {
    const max = Math.max(...dayLine.slice(Math.max(0, i - n), Math.min(dayLine.length, i + n + 1)).map(item => item.high));
    const min = Math.min(...dayLine.slice(Math.max(0, i - n), Math.min(dayLine.length, i + n + 1)).map(item => item.low));
    
    // 保留原有的趋势标记方法，以保持向后兼容性
    const trendStart = min === item.low;
    const trendEnd = max === item.high;
    
    // 添加基于斜率分析的趋势标记
    let slopeTrendStart = false;
    let slopeTrendEnd = false;
    
    // 计算线性回归斜率，需要至少有n/2个数据点
    if (i >= Math.floor(n/2)) {
      // 获取前n/2天的收盘价
      const previousPrices = dayLine.slice(Math.max(0, i - Math.floor(n/2)), i + 1).map(d => d.close);
      // 计算斜率
      const slope = calculateSlope(previousPrices);
      // 如果斜率从负变正，标记为趋势开始
      if (slope > slopeThreshold && (i === 0 || calculateSlope(dayLine.slice(Math.max(0, i - Math.floor(n/2) - 1), i).map(d => d.close)) <= 0)) {
        slopeTrendStart = true;
      }
      // 如果斜率从正变负，标记为趋势结束
      if (slope < -slopeThreshold && (i === 0 || calculateSlope(dayLine.slice(Math.max(0, i - Math.floor(n/2) - 1), i).map(d => d.close)) >= 0)) {
        slopeTrendEnd = true;
      }
    }
    
    return {
      ...item,
      max,
      min,
      // 保留原有趋势标记
      trendStart,
      trendEnd,
      // 添加基于斜率的趋势标记
      slopeTrendStart,
      slopeTrendEnd
    }
  });
  
  return result;
}

/**
 * 计算线性回归斜率
 * @param {Array} prices - 价格数组
 * @returns {Number} 斜率
 */
function calculateSlope(prices) {
  const n = prices.length;
  if (n <= 1) return 0;
  
  // 计算x和y的平均值
  const xMean = (n - 1) / 2; // x是索引，从0到n-1
  const yMean = prices.reduce((sum, price) => sum + price, 0) / n;
  
  // 计算斜率：Σ((x_i - x̄)(y_i - ȳ)) / Σ((x_i - x̄)²)
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    const yDiff = prices[i] - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }
  
  return denominator !== 0 ? numerator / denominator : 0;
}

/**
 * 计算目标趋势 - 使用斜率分析法
 * @param {Array} dayLineOrigin - 日线数据
 * @param {Number} profitFilter - 利润过滤器值，低于此值的趋势将被过滤
 * @param {Number} dailyProfitFilter - 日均利润过滤器值，低于此值的趋势将被过滤
 * @param {Number} slopeThreshold - 斜率阈值，用于斜率分析法，默认为0.5
 * @param {Number} n - 趋势区间天数
 * @param {Number} durationFilter - 持续天数过滤器值，低于此值的趋势将被过滤，默认为0
 * @param {Number} liquidityFilter - 流动性过滤器值，交易量乘以收盘价低于此值的趋势将被过滤，默认为100万
 * @returns {Array} 目标趋势列表
 */
export const calculateGoals = (dayLineOrigin, profitFilter = 50, dailyProfitFilter = 2, slopeThreshold = 0.5, n = 40, durationFilter = 7, liquidityFilter = 50000) => {
  const dayLine = dayLineFormat(dayLineOrigin, n, slopeThreshold)
  // 使用斜率分析法识别趋势变化点
  const tmp = dayLine.filter(item => item.slopeTrendStart || item.slopeTrendEnd || item.trendStart || item.trendEnd);
  
  // 优先使用斜率分析的趋势点，如果没有则回退到传统方法
  const goals = [];
  
  // 遍历所有趋势点
  for (let i = 0; i < tmp.length - 1; i++) {
    const current = tmp[i];
    const next = tmp[i + 1];
    
    // 检查是否是有效的趋势开始和结束组合
    const isValidStart = current.slopeTrendStart || current.trendStart;
    const isValidEnd = next.slopeTrendEnd || next.trendEnd;
    
    if (isValidStart && isValidEnd) {
      // 计算持续时间，确保不为NaN或无限值
      const duration = (new Date(next.time).getTime() - new Date(current.time).getTime()) / (1000 * 60 * 60 * 24);
      if (isNaN(duration) || !isFinite(duration) || duration <= 0) {
        continue; // 跳过无效的持续时间
      }
      
      // 计算利润，确保不为NaN或无限值
      const profit = current.low > 0 ? ((next.high - current.low) / current.low * 100) : 0;
      if (isNaN(profit) || !isFinite(profit)) {
        continue; // 跳过无效的利润
      }
      
      // 计算日均利润，确保不为NaN或无限值
      const dailyProfit = duration > 0 ? (profit / duration) : 0;
      if (isNaN(dailyProfit) || !isFinite(dailyProfit)) {
        continue; // 跳过无效的日均利润
      }
      
      // 计算趋势期间的日均流动性（所有交易日的交易量 * 收盘价的平均值）
      // 找出趋势开始和结束之间的所有日线数据
      const startIndex = dayLine.findIndex(item => item.time === current.time);
      const endIndex = dayLine.findIndex(item => item.time === next.time);
      
      if (startIndex !== -1 && endIndex !== -1 && startIndex < endIndex) {
        // 提取趋势期间的所有日线数据
        const trendDayLines = dayLine.slice(startIndex, endIndex + 1);
        
        // 计算每天的流动性（交易量 * 收盘价），确保不为NaN或无限值
        const dailyLiquidities = trendDayLines.map(day => {
          const liquidity = (day.volume || 0) * (day.close || 0);
          return isNaN(liquidity) || !isFinite(liquidity) ? 0 : liquidity;
        });
        
        // 确保有有效的流动性数据
        if (dailyLiquidities.length === 0 || dailyLiquidities.every(l => l === 0)) {
          continue; // 跳过无有效流动性数据的趋势
        }
        
        // 计算流动性统计指标，确保不为NaN或无限值
        const liquidityStats = {
          avg: dailyLiquidities.length > 0 ? (dailyLiquidities.reduce((sum, liquidity) => sum + liquidity, 0) / dailyLiquidities.length) : 0,
          min: dailyLiquidities.length > 0 ? Math.min(...dailyLiquidities) : 0,
          max: dailyLiquidities.length > 0 ? Math.max(...dailyLiquidities) : 0,
          median: dailyLiquidities.length > 0 ? [...dailyLiquidities].sort((a, b) => a - b)[Math.floor(dailyLiquidities.length / 2)] : 0
        };
        
        // 确保所有流动性统计值都是有效数字
        if (Object.values(liquidityStats).some(val => isNaN(val) || !isFinite(val))) {
          continue; // 跳过包含无效统计值的趋势
        }
        
        // 使用更复杂的过滤条件
        if (profit < profitFilter || 
            dailyProfit < dailyProfitFilter || 
            duration < durationFilter || 
            liquidityStats.avg < liquidityFilter || 
            liquidityStats.min < liquidityFilter * 0.5) {
          continue;
        }
        
        // 将流动性统计信息添加到目标对象中，以便在UI中显示
        current.liquidityStats = liquidityStats;
      } else {
        // 如果找不到完整的趋势期间数据，则跳过此项
        continue;
      }
      
      // 确定趋势类型（NEW_HIGH、REBOUND、NORMAL）
      let trendCategory = 'NORMAL';
      
      // 获取趋势前的历史数据
      const historyStartIndex = Math.max(0, startIndex - 60); // 查看前60个交易日
      const historyData = dayLine.slice(historyStartIndex, startIndex);
      
      if (historyData.length > 0) {
        // 获取历史最高价
        const historyHighest = Math.max(...historyData.map(item => item.high));
        // 获取历史最低价
        const historyLowest = Math.min(...historyData.map(item => item.low));
        
        // 如果结束价格创了新高（超过历史最高价的5%），则为创新高
        if (next.high > historyHighest * 1.05) {
          trendCategory = 'NEW_HIGH';
        }
        // 如果是从低点反弹（开始价格接近历史最低价的10%范围内），则为反弹
        else if (current.low < historyLowest * 1.1) {
          trendCategory = 'REBOUND';
        }
      }
      
      // 将流动性统计信息添加到目标对象中
      goals.push({
        startPrice: current.low,
        endPrice: next.high,
        goalType: current.low < next.high ? 'buy' : 'sell',
        startTime: current.time,
        liquidityStats: current.liquidityStats || {
          avg: 0,
          min: 0,
          max: 0,
          median: 0
        }, // 添加流动性统计信息，确保有默认值
        endTime: next.time,
        profit: isNaN(profit) || !isFinite(profit) ? 0 : profit,
        // 计算duration,time是Date格式,需要转换为毫秒
        duration: isNaN(duration) || !isFinite(duration) || duration <= 0 ? 1 : duration,
        // 日均涨幅
        dailyProfit: isNaN(dailyProfit) || !isFinite(dailyProfit) ? 0 : dailyProfit,
        // 标记是否使用斜率分析法
        usedSlopeAnalysis: current.slopeTrendStart || next.slopeTrendEnd,
        // 添加趋势类型（NEW_HIGH、REBOUND、NORMAL）
        trendCategory
      });
    }
  }
  
  return goals.map((goal, index) => { 
    return {...goal, index };
  });
}