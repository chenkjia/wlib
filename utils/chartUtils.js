/**
 * 图表数据计算工具函数
 * 用于前端和服务器端共享的图表数据计算函数
 */

import { algorithmMap } from './algorithmUtils.js'
import logger from './logger.js'

/**
 * 获取较小数量级的值
 * @param {number} num - 输入数字
 * @returns {number} 较小数量级的值
 */
export function getSmallerOrderValue(num) {
  if (num === 0) return 0;
  
  const absNum = Math.abs(num);
  
  // 处理整数部分 >=1 的情况
  if (absNum >= 1) {
    // 获取最高位的数量级
    const magnitude = Math.floor(Math.log10(absNum));
    return Math.pow(10, magnitude);
  }
  
  // 处理纯小数的情况（整数部分为 0）
  else {
    // 转换为科学计数法字符串（如 0.001 → "1e-3"）
    const scientificStr = absNum.toExponential();
    // 提取指数部分（如 "1e-3" → -3）
    const exponent = parseInt(scientificStr.split('e')[1]);
    // 计算小一位的值（如 -3 → 10^(-4) = 0.0001）
    return Math.pow(10, exponent - 1);
  }
}

/**
 * 计算移动平均线
 * @param {Array<number>} data - 历史行情数据
 * @param {number} period - 计算周期
 * @returns {Array<number>} 移动平均线数据
 */
export function calculateMA(data, period) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const param = i >= period - 1 ? period : i + 1;
    const sum = data.slice(i - param + 1, i + 1)
      .reduce((acc, cur) => acc + cur, 0);
    result.push(sum / param);
  }
  return result;
}
/**
 * 计算指数移动平均线
 * @param {Array<number>} data - 历史行情数据
 * @param {number} period - 计算周期
 * @returns {Array<number>} 指数移动平均线数据
 */
export function calculateEMA(data, period) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  const result = [];
  const multiplier = 2 / (period + 1);
  result.push(data[0]);
  for (let i = 1; i < data.length; i++) {
    result.push((data[i] - result[i - 1]) * multiplier + result[i - 1]);
  }
  return result;
}

/**
 * 计算持仓方向
 * @param {Object} params - 输入参数对象
 * @param {Array<number>} params.maS - 短期移动平均线数据
 * @param {Array<number>} params.maM - 中期移动平均线数据
 * @param {Array<number>} params.maL - 长期移动平均线数据
 * @returns {Array<number>} 持仓方向数组，1表示多头，-1表示空头，0表示无持仓
 */
export function calculatePosition({maS, maM, maL}) {
  return maS.map((short, index) => {
    if (short > maM[index] && maM[index] > maL[index]) {
      return 1;
    } else if (short < maM[index] && maM[index] < maL[index]) {
      return -1;
    } else {
      return 0;
    }
  });
}

/**
 * 计算持仓天数
 * @param {Object} params - 输入参数对象
 * @param {Array<number>} params.position - 持仓方向数组，1表示多头，-1表示空头，0表示无持仓
 * @returns {Array<number>} 持续持仓天数数组，正数表示多头天数，负数表示空头天数
 */
export function calculateSign1({position}) {
  // 参数验证
  if (!Array.isArray(position) || position.length === 0) {
    return [];
  }

  // 初始化结果数组
  const holdingDays = new Array(position.length).fill(null);
  holdingDays[0] = position[0];

  // 计算持续持仓天数
  for (let i = 1; i < position.length; i++) {
    const prevDays = holdingDays[i - 1];
    const currentPosition = position[i];

    if (prevDays > 0 && currentPosition > 0) {
      holdingDays[i] = prevDays + 1;
    } else if (prevDays < 0 && currentPosition < 0) {
      holdingDays[i] = prevDays - 1;
    } else {
      holdingDays[i] = currentPosition;
    }
  }

  return holdingDays;
}

/**
 * 计算均线离散度
 * @param {Object} params - 输入参数对象
 * @param {Array<number>} params.maS - 短期移动平均线数据
 * @param {Array<number>} params.maM - 中期移动平均线数据
 * @param {Array<number>} params.maL - 长期移动平均线数据
 * @returns {Array<number>} 均线离散度数组
 */
export function calculateSign2({maS, maM, maL}) {
  return maS.map((ma, index) => {
    const max = Math.max(ma, maM[index], maL[index])
    const min = Math.min(ma, maM[index], maL[index])
    return (max - min)/min
  })
}
// 计算均线趋势排列：判断四条均线是否呈现正向或负向排列，并统计连续天数
export function calculateTrendAlignment({maS, maM, maL, maX}) {
  const signals = maS.map((ma, index) => {
    if (ma>=maM[index] && maM[index]>=maL[index] && maL[index]>=maX[index]) {
      return 1
    }
    if (ma<=maM[index] && maM[index]<=maL[index] && maL[index]<=maX[index]) {
      return -1
    }
    return 0
  })
  
  // 计算连续天数
  const result = []
  for (let i = 0; i < signals.length; i++) {
    if (signals[i] === 0) {
      result[i] = 0
    } else if (i === 0) {
      result[i] = signals[i]
    } else {
      // 只有当前信号与前一个信号相同时才累加
      if (signals[i] === signals[i - 1] && result[i - 1] !== 0) {
        result[i] = result[i - 1] + signals[i]
      } else {
        result[i] = signals[i]
      }
    }
  }
  return result
}

/**
 * 计算技术指标
 * @param {Array<Object>} data - 数据
 * @returns {Array<Object>} 包含技术指标的日线数据
 */
export function calculateMetric(data, {s=7, m=50, l=100, x=200}) {
  const close = data.map(item => item.close);
  const volume = data.map(item => item.volume);
  const maS = calculateMA(close, s);
  const maM = calculateMA(close, m);
  const maL = calculateMA(close, l);
  const maX = calculateMA(close, x);
  const position = calculatePosition({maS, maM, maL})
  const sign1 = calculateSign1({position})
  const sign2 = calculateSign2({maS, maM, maL})
  const trendAlignment = calculateTrendAlignment({maS, maM, maL, maX})
  const volumeMaS = calculateMA(volume, s);
  const volumeMaM = calculateMA(volume, m);
  const volumeMaL = calculateMA(volume, l);
  const volumeMaX = calculateMA(volume, x);
  return {
    line: data,
    data,
    maS,
    maM,
    maL,
    maX,
    position,
    sign1,
    sign2,
    trendAlignment,
    volumeMaS,
    volumeMaM,
    volumeMaL,
    volumeMaX,
  }
}

/**
 * 计算日线技术指标
 * @param {Array<Object>} dayLine - 日线数据
 * @returns {Array<Object>} 包含技术指标的日线数据
 */
export function calculateDayMetric(dayLine, {s=7, m=50, l=100, x=200} = {}) {
  return calculateMetric(dayLine, {s, m, l, x})
}

/**
 * 计算小时线技术指标
 * @param {Array<Object>} hourLine - 小时线数据
 * @returns {Array<Object>} 包含技术指标的小时线数据
 */
export function calculateHourMetric(hourLine, {
  s=7,
  m=14,
  l=50,
  x=100
} = {}) {
  return calculateMetric(hourLine, {s, m, l, x})
}

export const calculateStock = (props) => {
  const { dayLine, hourLine, ma, buyConditions, sellConditions } = props
  const dayLineWithMetric = calculateDayMetric(dayLine, ma)
  const hourLineWithMetric = calculateHourMetric(hourLine, ma)
  const transactions =  calculateTransactions({
    dayLineWithMetric,
    hourLineWithMetric,
    buyConditions,
    sellConditions
  })
  // 通过交易记录计算回测数据
  const backtestData = calculateBacktestData(transactions, dayLine)
  return {
    dayLineWithMetric,
    hourLineWithMetric,
    transactions,
    backtestData
  }
}

/**
 * 计算交易回测数据，统计交易关键指标
 * @param {Array} transactions - 交易记录数组
 * @param {Array} dayLine - 日线数据数组
 * @returns {Object} 包含交易统计指标的对象
 */
export const calculateBacktestData = (transactions, dayLine = []) => {
  // 默认值
  const result = {
    totalTrades: 0,        // 交易笔数
    profitTrades: 0,       // 盈利笔数
    lossTrades: 0,         // 亏损笔数
    winRate: 0,            // 胜率
    daysDuration: 0,       // 交易总天数
    priceChange: 0,        // 交易总涨跌幅
    dailyChange: 0,        // 交易日均涨跌幅
    maxDrawdown: 0,        // 最大回撤
    // 日线相关统计
    dayLineCount: 0,       // 日线总数
    dayLinePriceChange: 0, // 日线总涨跌幅
    dayLineDailyChange: 0, // 日线日均涨跌幅
    // 对比指标
    priceChangeDiff: 0,
    dailyChangeDiff: 0,
  }
  
  // 过滤出已完成的交易（有买入和卖出时间）
  const completedTrades = transactions.filter(t => t.buyTime && t.sellTime)
  result.totalTrades = completedTrades.length
  
  if (completedTrades.length === 0) {
    return result
  }
  
  // 计算盈利和亏损交易笔数
  result.profitTrades = completedTrades.filter(t => t.profit > 0).length
  result.lossTrades = completedTrades.filter(t => t.profit <= 0).length
  
  // 计算胜率
  result.winRate = result.profitTrades / result.totalTrades * 100
  
  // 计算交易总天数（所有交易持仓天数的总和）
  result.daysDuration = completedTrades.reduce((total, trade) => total + trade.tradeDays, 0)
  
  // 计算交易总涨跌幅（从第一笔交易买入价到最后一笔交易卖出价）
  result.priceChange = completedTrades.reduce((total, trade) => total + trade.profit, 0)
  // 计算交易日均涨跌幅
  if (result.daysDuration > 0) {
    result.dailyChange = result.priceChange / result.daysDuration
  }
  
  // 计算日线相关统计
  if (Array.isArray(dayLine) && dayLine.length > 0) {
    // 找到第一次交易的索引
    const firstDayLineIndex = dayLine.findIndex(d => d.time === completedTrades[0].buyTime)
    
    // 日线总涨跌幅（从第一个日线到最后一个日线）
    const firstDayLine = dayLine[firstDayLineIndex]
    const lastDayLine = dayLine[dayLine.length - 1]
    
    result.dayLineCount = dayLine.length - firstDayLineIndex;
    if (firstDayLine && lastDayLine && firstDayLine.close && lastDayLine.close) {
      const change = ((lastDayLine.close - firstDayLine.close) / firstDayLine.close) * 100
      result.dayLinePriceChange = change
      
      // 计算日线日均涨跌幅
      if (result.dayLineCount > 0) {
        result.dayLineDailyChange = change / result.dayLineCount
      }
      
      // 计算涨跌幅差值（交易总涨跌幅-日线总涨跌幅）
      if (change !== 0) {
        result.priceChangeDiff = result.priceChange - change
      }
      
      // 计算日均差值（交易日均涨跌幅-日线日均涨跌幅）
      if (result.dayLineDailyChange !== 0) {
        result.dailyChangeDiff = result.dailyChange - result.dayLineDailyChange
      }
    }
  }
  result.maxDrawdown = Math.min(...completedTrades.map(({profit}) => profit))
  
  return result
}

// calculateTransactions
// 需要计算买入信号和卖出信号,传入dayLine,hourLine
// 先计算信号
// 最后根据信号计算交易
export const calculateTransactions = (props) => {
  const signals = calculateSignals(props)
  // 根据信号生成交易记录
  const transactions = []
  let lastBuySignal = null

  signals.forEach(signal => {
    if (signal.type === 'buy') {
      lastBuySignal = signal
    } else if (signal.type === 'sell' && lastBuySignal) {
      // 计算这笔交易的收益
      const profit = ((signal.price - lastBuySignal.price) / lastBuySignal.price) * 100
      // 计算持续天数
      const tradeDays = Math.ceil((new Date(signal.time).getTime() - new Date(lastBuySignal.time).getTime()) / (1000 * 3600 * 24)) || 1 // 至少为1天
      transactions.push({
        buyTime: lastBuySignal.time,
        buyPrice: lastBuySignal.price,
        sellTime: signal.time,
        sellPrice: signal.price,
        profit,
        tradeDays,
        duration: tradeDays // 添加duration字段，与tradeDays保持一致
      })
      
      lastBuySignal = null
    }
  })
  return transactions
}

// calculateSignals 
// 计算信号
// 传入含技术参数的dayLine, hourLine, 卖入算法组, 卖出算法组
// 计算dayLine和hourLine的技术参数
const calculateSignals = (props) => {
  const { 
    dayLineWithMetric,
    hourLineWithMetric,
    buyConditions,
    sellConditions
  } = props
  const buyLength = buyConditions.length
  const sellLength = sellConditions.length
  // 如果买入或卖出条件长度为0，或者其中包含空数组，则直接返回空数组
  if (buyLength === 0 || sellLength === 0 || buyConditions.some((item) => item.length === 0) || sellConditions.some((item) => item.length === 0)) {
    return []
  }
  let buyStep = 0,
    sellStep = 0,
    hold = false
  const signals = dayLineWithMetric.data.reduce((prev, cur, index) => {
    if (buyStep < buyLength && !hold) {
      const buyResult = buyConditions[buyStep].every((conditionType) => {
        return algorithmMap[conditionType](index, dayLineWithMetric)
      })
      if (buyResult) {
        buyStep++
      }
      if (buyStep === buyLength) {
        hold = true
        buyStep = 0
        prev.push({
          time: cur.time,
          type: 'buy',
          price: cur.close
        })
      }
    }
    if (sellStep < sellLength && hold) {
      const sellResult = sellConditions[sellStep].every((conditionType) => {
        return algorithmMap[conditionType](index, dayLineWithMetric)
      })
      if (sellResult) {
        sellStep++
      }
      if (sellStep === sellLength) {
        sellStep = 0
        hold = false
        prev.push({
          time: cur.time,
          type: 'sell',
          price: cur.close
        })
      }
    }
    return prev
  }, [])
  
  return signals
}
