/**
 * 图表数据计算工具函数
 * 用于前端和服务器端共享的图表数据计算函数
 */
import Decimal from 'decimal.js'
import { algorithmMap, evaluateConditionTree } from './algorithmUtils.js'
import logger from './logger.js'

/**
 * 将日线数据按周聚合
 * @param {Array} dayLine - 日线数据
 * @returns {Array} 周线数据
 */
export function aggregateDayToWeek(dayLine = []) {
  if (!Array.isArray(dayLine) || dayLine.length === 0) return []
  
  const weekLine = []
  let currentWeek = null
  
  for (const day of dayLine) {
    const date = new Date(day.time)
    // 获取当前日期是周几 (0是周日, 1-6是周一到周六)
    const dayOfWeek = date.getDay()
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const monday = new Date(date)
    monday.setDate(date.getDate() + diffToMonday)
    monday.setHours(0, 0, 0, 0)
    const weekKey = monday.getTime()
    
    if (!currentWeek || currentWeek.weekKey !== weekKey) {
      if (currentWeek) {
        weekLine.push(currentWeek.data)
      }
      currentWeek = {
        weekKey,
        data: {
          time: day.time,
          open: day.open,
          high: day.high,
          low: day.low,
          close: day.close,
          volume: day.volume || 0,
          amount: day.amount || 0
        }
      }
    } else {
      currentWeek.data.time = day.time // 始终更新为该周最新的一天
      currentWeek.data.high = Math.max(currentWeek.data.high, day.high)
      currentWeek.data.low = Math.min(currentWeek.data.low, day.low)
      currentWeek.data.close = day.close
      currentWeek.data.volume += (day.volume || 0)
      currentWeek.data.amount += (day.amount || 0)
    }
  }
  
  if (currentWeek) {
    weekLine.push(currentWeek.data)
  }
  
  return weekLine
}

/**
 * 计算移动平均线
 * @param {Array<number>} data - 历史行情数据
 * @param {number} period - 计算周期
 * @returns {Array<number>} 移动平均线数据
 */
export function calculateMA(data, period) {
  const normalizedPeriod = Number(period)
  if (!Array.isArray(data) || data.length === 0 || !Number.isFinite(normalizedPeriod) || normalizedPeriod <= 0) {
    return [];
  }
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const param = i >= normalizedPeriod - 1 ? normalizedPeriod : i + 1;
    const sum = data.slice(i - param + 1, i + 1)
      .reduce((acc, cur) => new Decimal(acc).plus(cur), new Decimal(0));
    result.push(new Decimal(sum).div(param).toNumber());
  }
  return result;
}

/**
 * 按缠论包含关系做高低价格式化（仅处理 high/low，输出无上下引线实体柱）
 * @param {Array<Object>} rawLine
 * @returns {Array<Object>}
 */
export function formatLineForChanlun(rawLine = []) {
  if (!Array.isArray(rawLine) || rawLine.length === 0) return []
  const formatted = rawLine.map(item => ({ ...item, chanlunTrend: 0 }))
  let direction = 0 // 1: 向上, -1: 向下, 0: 未确定

  // 第1步：按包含关系格式化 high/low
  for (let i = 1; i < formatted.length; i++) {
    const prev = formatted[i - 1]
    const curr = formatted[i]
    if (!prev || !curr) continue

    const prevHigh = Number(prev.high)
    const prevLow = Number(prev.low)
    const currHigh = Number(curr.high)
    const currLow = Number(curr.low)
    if (![prevHigh, prevLow, currHigh, currLow].every(Number.isFinite)) continue

    // 仅判断高低点是否存在包含关系
    const hasContain =
      (currHigh <= prevHigh && currLow >= prevLow) ||
      (currHigh >= prevHigh && currLow <= prevLow)
    const isUp = currHigh > prevHigh && currLow > prevLow
    const isDown = currHigh < prevHigh && currLow < prevLow

    // 包含关系：按当前方向合并；非包含关系：用于更新方向
    let finalHigh = currHigh
    let finalLow = currLow
    if (hasContain) {
      const pick = direction >= 0 ? Math.max : Math.min
      finalHigh = pick(prevHigh, currHigh)
      finalLow = pick(prevLow, currLow)
    } else if (isUp) {
      direction = 1
    } else if (isDown) {
      direction = -1
    }

    // 防御：确保 high >= low
    const high = Math.max(finalHigh, finalLow)
    const low = Math.min(finalHigh, finalLow)

    formatted[i] = {
      ...curr,
      high,
      low,
      // 先占位，第二步按“分型确认”回填趋势和颜色方向
      open: low,
      close: high
    }
  }

  // 第2步：分型确认后再回填趋势
  // 规则：
  // 1) 未确认K线保持 chanlunTrend = 0（蓝色）
  // 2) 第一个分型出现后，先确认其“之前”的趋势
  // 3) 分型需要后一根K线存在才算确认（因此分型索引范围为 1..n-2）
  // 4) 相邻用于成笔的分型不能重叠，且至少隔一根独立K线
  const trendMarks = new Array(formatted.length).fill(0)
  const fractals = []
  const MIN_BI_CENTER_GAP = 4

  const pickBetterFractal = (prevFractal, nextFractal) => {
    if (!prevFractal) return nextFractal
    if (prevFractal.type !== nextFractal.type) return nextFractal
    const prevBar = formatted[prevFractal.index]
    const nextBar = formatted[nextFractal.index]
    if (!prevBar || !nextBar) return prevFractal
    // 同类型分型取“更极值”的一个，减少噪声
    if (nextFractal.type === 1) {
      return nextBar.high >= prevBar.high ? nextFractal : prevFractal
    }
    return nextBar.low <= prevBar.low ? nextFractal : prevFractal
  }

  const getFractalType = (a, b, c) => {
    if (!a || !b || !c) return 0
    const ah = Number(a.high), al = Number(a.low)
    const bh = Number(b.high), bl = Number(b.low)
    const ch = Number(c.high), cl = Number(c.low)
    if (![ah, al, bh, bl, ch, cl].every(Number.isFinite)) return 0
    const isTop = bh > ah && bl > al && bh > ch && bl > cl
    const isBottom = bh < ah && bl < al && bh < ch && bl < cl
    if (isTop) return 1
    if (isBottom) return -1
    return 0
  }

  const canFormBi = (leftFractal, rightFractal) => {
    if (!leftFractal || !rightFractal) return false
    // 3根K线分型：中心间距>=3才不会重叠；这里额外要求>=4，保证中间至少隔1根独立K线
    return rightFractal.index - leftFractal.index >= MIN_BI_CENTER_GAP
  }

  for (let i = 1; i < formatted.length - 1; i++) {
    const type = getFractalType(formatted[i - 1], formatted[i], formatted[i + 1])
    if (type === 0) continue
    const candidate = { index: i, type }
    const last = fractals[fractals.length - 1]
    if (!last) {
      fractals.push(candidate)
      continue
    }
    const better = pickBetterFractal(last, candidate)
    if (better.index === last.index) {
      continue
    }
    if (last.type === candidate.type) {
      fractals[fractals.length - 1] = better
    } else {
      if (canFormBi(last, candidate)) {
        fractals.push(candidate)
      }
    }
  }

  const fillRange = (start, end, trend) => {
    if (trend === 0) return
    const left = Math.max(0, start)
    const right = Math.min(formatted.length - 1, end)
    for (let i = left; i <= right; i++) trendMarks[i] = trend
  }

  if (fractals.length > 0) {
    // 第一个分型：确认其之前趋势（顶分型前是上升，底分型前是下降）
    const first = fractals[0]
    let currentTrend = first.type === 1 ? 1 : -1
    fillRange(0, first.index, currentTrend)

    // 分型确认K线（i+1）确认反向趋势
    let cursor = first.index + 1
    if (cursor < formatted.length) {
      currentTrend = -currentTrend
      trendMarks[cursor] = currentTrend
    }

    // 后续每个分型：回填到该分型，再在确认K线上切换方向
    for (let i = 1; i < fractals.length; i++) {
      const f = fractals[i]
      fillRange(cursor, f.index, currentTrend)
      cursor = f.index + 1
      if (cursor < formatted.length) {
        currentTrend = -currentTrend
        trendMarks[cursor] = currentTrend
      }
    }
    // cursor 之后保持 0，表示“未确认趋势”
  }

  for (let i = 0; i < formatted.length; i++) {
    const trend = trendMarks[i]
    formatted[i].chanlunTrend = trend
    // 缠论柱不显示上下引线：实体覆盖 [low, high]
    // 趋势未定（0）同样保留实体，颜色由渲染层标记为蓝色
    formatted[i].open = trend < 0 ? formatted[i].high : formatted[i].low
    formatted[i].close = trend < 0 ? formatted[i].low : formatted[i].high
  }

  return formatted
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
  const multiplier = new Decimal(2).div(period + 1);
  result.push(data[0]);
  for (let i = 1; i < data.length; i++) {
    const prevEMA = new Decimal(result[i - 1]);
    const currentPrice = new Decimal(data[i]);
    const newEMA = currentPrice.minus(prevEMA).mul(multiplier).plus(prevEMA);
    result.push(newEMA.toNumber());
  }
  return result;
}

/**
 * 计算 BIAS 乖离率
 * BIAS = (收盘价 - MA) / MA * 100
 * @param {Array<number>} close - 收盘价序列
 * @param {number} period - 均线周期
 * @returns {Array<number>}
 */
export function calculateBIAS(close = [], period = 6) {
  if (!Array.isArray(close) || close.length === 0) return []
  const ma = calculateMA(close, period)
  return close.map((price, index) => {
    const maValue = Number(ma[index])
    if (!Number.isFinite(maValue) || maValue === 0) return 0
    return new Decimal(price).minus(maValue).div(maValue).mul(100).toNumber()
  })
}

/**
 * 计算 RSV (Raw Stochastic Value)
 * RSV = (收盘价 - N日最低价) / (N日最高价 - N日最低价) * 100
 * @param {Array<Object>} dayLineData - K线数据，包含 high/low/close
 * @param {number} period - N 周期，默认 9
 * @returns {Array<number>} RSV 数组（0-100）
 */
export function calculateRSV(dayLineData = [], period = 9) {
  if (!Array.isArray(dayLineData) || dayLineData.length === 0) {
    return [];
  }
  const rsv = new Array(dayLineData.length).fill(null);
  for (let i = 0; i < dayLineData.length; i++) {
    const start = Math.max(0, i - (period - 1));
    let highestHigh = -Infinity;
    let lowestLow = Infinity;
    for (let j = start; j <= i; j++) {
      const h = Number(dayLineData[j]?.high ?? dayLineData[j]?.close ?? 0);
      const l = Number(dayLineData[j]?.low ?? dayLineData[j]?.close ?? 0);
      if (h > highestHigh) highestHigh = h;
      if (l < lowestLow) lowestLow = l;
    }
    const closeVal = Number(dayLineData[i]?.close ?? 0);
    const denom = new Decimal(highestHigh).minus(lowestLow);
    if (denom.eq(0)) {
      rsv[i] = i > 0 ? (rsv[i - 1] ?? 0) : 0;
      continue;
    }
    const numerator = new Decimal(closeVal).minus(lowestLow);
    rsv[i] = numerator.div(denom).mul(100).toNumber();
  }
  return rsv;
}

/**
 * 计算 KDJ 指标
 * K_t = ((K-1)/K) * K_{t-1} + (1/K) * RSV_t
 * D_t = ((D-1)/D) * D_{t-1} + (1/D) * K_t
 * J_t = 3*K_t - 2*D_t
 * 初始值通常设为 K_0 = D_0 = 50
 * @param {Array<Object>} dayLineData - K线数据，包含 high/low/close
 * @param {Object} options - { n: RSV周期, k: K平滑参数, d: D平滑参数 }
 * @returns {{k:Array<number>, d:Array<number>, j:Array<number>, rsv:Array<number>}}
 */
export function calculateKDJ(dayLineData = [], { n = 9, k = 3, d = 3 } = {}) {
  const rsv = calculateRSV(dayLineData, n);
  if (rsv.length === 0) {
    return { k: [], d: [], j: [], rsv: [] };
  }
  const kArr = new Array(rsv.length).fill(null);
  const dArr = new Array(rsv.length).fill(null);
  const jArr = new Array(rsv.length).fill(null);
  const alphaK = new Decimal(1).div(k);
  const alphaD = new Decimal(1).div(d);

  // 初始值
  kArr[0] = 50;
  dArr[0] = 50;
  jArr[0] = new Decimal(3).mul(kArr[0]).minus(new Decimal(2).mul(dArr[0])).toNumber();

  for (let i = 1; i < rsv.length; i++) {
    const prevK = new Decimal(kArr[i - 1]);
    const prevD = new Decimal(dArr[i - 1]);
    const rsvVal = new Decimal(rsv[i] ?? rsv[i - 1] ?? 0);
    const kVal = prevK.mul(new Decimal(1).minus(alphaK)).plus(rsvVal.mul(alphaK)).toNumber();
    const dVal = prevD.mul(new Decimal(1).minus(alphaD)).plus(new Decimal(kVal).mul(alphaD)).toNumber();
    const jVal = new Decimal(3).mul(kVal).minus(new Decimal(2).mul(dVal)).toNumber();
    kArr[i] = kVal;
    dArr[i] = dVal;
    jArr[i] = jVal;
  }
  return { k: kArr, d: dArr, j: jArr, rsv };
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
    const shortDecimal = new Decimal(short);
    const mediumDecimal = new Decimal(maM[index]);
    const longDecimal = new Decimal(maL[index]);
    
    if (shortDecimal.gt(mediumDecimal) && mediumDecimal.gt(longDecimal)) {
      return 1;
    } else if (shortDecimal.lt(mediumDecimal) && mediumDecimal.lt(longDecimal)) {
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
    const maDecimal = new Decimal(ma);
    const maMDecimal = new Decimal(maM[index]);
    const maLDecimal = new Decimal(maL[index]);
    
    const max = Decimal.max(maDecimal, maMDecimal, maLDecimal);
    const min = Decimal.min(maDecimal, maMDecimal, maLDecimal);
    
    return max.minus(min).div(min).toNumber();
  });
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
 * @param {Object} config - 配置对象，包含ma、macd和enabledIndicators
 * @returns {Array<Object>} 包含技术指标的日线数据
 */
export function calculateMetric(data, {ma, macd, kdj = { n: 9, k: 3, d: 3 }, bias = { s: 6, m: 12, l: 24 }, volumeMa = { s: 5, l: 10 }, enabledIndicators = ['ma', 'macd']}) {
  const close = data.map(item => item.close);
  const volume = data.map(item => item.volume);
  const high = data.map(item => item.high);
  const low = data.map(item => item.low);
  
  let result = {
    line: data,
    data,
    close,
    volume,
    high,
    low
    
  };

  const volumeMaSPeriod = Math.max(2, Number(volumeMa?.s) || 5)
  const volumeMaLPeriod = Math.max(volumeMaSPeriod, Number(volumeMa?.l) || 10)
  const volumeMaS = calculateMA(volume, volumeMaSPeriod)
  const volumeMaL = calculateMA(volume, volumeMaLPeriod)
  result = {
    ...result,
    volumeMaS,
    volumeMaL
  }
  
  // 只有启用MA时才计算MA相关指标
  if (enabledIndicators.includes('ma')) {
    const maS = Number(ma.s) > 0 ? calculateMA(close, ma.s) : [];
    const maM = Number(ma.m) > 0 ? calculateMA(close, ma.m) : [];
    const maL = Number(ma.l) > 0 ? calculateMA(close, ma.l) : [];
    const maX = Number(ma.x) > 0 ? calculateMA(close, ma.x) : [];
    const position = calculatePosition({maS, maM, maL})
    const sign1 = calculateSign1({position})
    const sign2 = calculateSign2({maS, maM, maL})
    const trendAlignment = calculateTrendAlignment({maS, maM, maL, maX})
    // const volumeMaS = calculateMA(volume, ma.s);
    // const volumeMaM = calculateMA(volume, ma.m);
    // const volumeMaL = calculateMA(volume, ma.l);
    // const volumeMaX = calculateMA(volume, ma.x);
    
    result = {
      ...result,
      maS,
      maM,
      maL,
      maX,
      position,
      sign1,
      sign2,
      trendAlignment,
      // volumeMaS,
      // volumeMaM,
      // volumeMaL,
      // volumeMaX
    };
  }
  
  // 只有启用MACD时才计算MACD相关指标
  if (enabledIndicators.includes('macd')) {
    const emaS = calculateEMA(close, macd.s);
    const emaL = calculateEMA(close, macd.l);
    const difRaw = emaS.map((ema, index) => ema - emaL[index])
    const deaRaw = calculateEMA(difRaw, macd.d)
    const barRaw = difRaw.map((line, index) => line - deaRaw[index])

    // MACD 百分比归一化：按当根收盘价缩放后乘100，便于跨标的比较
    const normalizeByClose = (value, index) => {
      const closeValue = Number(close[index])
      if (!Number.isFinite(closeValue) || closeValue === 0) return 0
      return new Decimal(value).div(closeValue).mul(100).toNumber()
    }
    const dif = difRaw.map((value, index) => normalizeByClose(value, index))
    const dea = deaRaw.map((value, index) => normalizeByClose(value, index))
    const bar = barRaw.map((value, index) => normalizeByClose(value, index))
    
    result = {
      ...result,
      dif,
      dea,
      bar
    };
  }
  
  // 启用KDJ时计算KDJ相关指标
  if (enabledIndicators.includes('kdj')) {
    const { k, d, j, rsv } = calculateKDJ(data, { n: kdj.n, k: kdj.k, d: kdj.d });
    result = {
      ...result,
      kdjK: k,
      kdjD: d,
      kdjJ: j,
      kdjRSV: rsv
    };
  }

  // 启用BIAS时计算BIAS相关指标
  if (enabledIndicators.includes('bias')) {
    const biasS = calculateBIAS(close, bias.s)
    const biasM = calculateBIAS(close, bias.m)
    const biasL = calculateBIAS(close, bias.l)
    result = {
      ...result,
      biasS,
      biasM,
      biasL
    }
  }
  
  return result;
}

export const calculateStock = (props) => {
  const { dayLine, hourLine, ma, macd, kdj, bias, volumeMa, buyConditions, sellConditions, enabledIndicators } = props
  const weekLine = aggregateDayToWeek(dayLine)
  const dayLineWithMetric = calculateMetric(dayLine, { ma, macd, kdj, bias, volumeMa, enabledIndicators })
  const weekLineWithMetric = calculateMetric(weekLine, { ma, macd, kdj, bias, volumeMa, enabledIndicators })
  const hourLineWithMetric = calculateMetric(hourLine, { ma, macd, kdj, bias, volumeMa, enabledIndicators })
  
  const transactions =  calculateTransactions({
    dayLineWithMetric,
    weekLineWithMetric,
    hourLineWithMetric,
    buyConditions,
    sellConditions
  })
  // 通过交易记录计算回测数据
  const backtestData = calculateBacktestData(transactions, dayLine)
  return {
    dayLineWithMetric,
    weekLineWithMetric,
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
  result.winRate = new Decimal(result.profitTrades).div(result.totalTrades).mul(100).toNumber()
  
  // 计算交易总天数（所有交易持仓天数的总和）
  result.daysDuration = completedTrades.reduce((total, trade) => total + trade.tradeDays, 0)
  
  // 计算交易总涨跌幅（从第一笔交易买入价到最后一笔交易卖出价）
  result.priceChange = completedTrades.reduce((total, trade) => new Decimal(total).plus(trade.profit).toNumber(), 0)
  // 计算交易日均涨跌幅
  if (result.daysDuration > 0) {
    result.dailyChange = new Decimal(result.priceChange).div(result.daysDuration).toNumber()
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
      const lastClose = new Decimal(lastDayLine.close);
      const firstClose = new Decimal(firstDayLine.close);
      const change = lastClose.minus(firstClose).div(firstClose).mul(100).toNumber();
      result.dayLinePriceChange = change
      
      // 计算日线日均涨跌幅
      if (result.dayLineCount > 0) {
        result.dayLineDailyChange = new Decimal(change).div(result.dayLineCount).toNumber()
      }
      
      // 计算涨跌幅差值（交易总涨跌幅-日线总涨跌幅）
      if (change !== 0) {
        result.priceChangeDiff = new Decimal(result.priceChange).minus(change).toNumber()
      }
      
      // 计算日均差值（交易日均涨跌幅-日线日均涨跌幅）
      if (result.dayLineDailyChange !== 0) {
        result.dailyChangeDiff = new Decimal(result.dailyChange).minus(result.dayLineDailyChange).toNumber()
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
      const sellPrice = new Decimal(signal.price);
      const buyPrice = new Decimal(lastBuySignal.price);
      const profit = sellPrice.minus(buyPrice).div(buyPrice).mul(100).toNumber();
      // 计算持续天数
      const tradeDays = Math.ceil((new Date(signal.time).getTime() - new Date(lastBuySignal.time).getTime()) / (1000 * 3600 * 24)) || 1 // 至少为1天
      transactions.push({
        buyIndex: lastBuySignal.index,
        buyTime: lastBuySignal.time,
        buyPrice: lastBuySignal.price,
        sellIndex: signal.index,
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
// 传入含技术参数的dayLine, weekLine, hourLine, 卖入算法组, 卖出算法组
// 计算dayLine和hourLine的技术参数
const calculateSignals = (props) => {
  const { 
    dayLineWithMetric,
    weekLineWithMetric,
    hourLineWithMetric,
    buyConditions,
    sellConditions
  } = props
  const buyLength = buyConditions.length
  const sellLength = sellConditions.length
  // 如果买入或卖出条件长度为0，或者其中包含空数组/空树组，则直接返回空数组
  const hasInvalidGroup = (groups) => groups.some((group) => {
    if (Array.isArray(group)) {
      return group.length === 0
    }
    // 兼容树结构：{ type: 'group' | 'condition', op?, children? }
    if (group && typeof group === 'object') {
      if (group.type === 'group') {
        return !Array.isArray(group.children) || group.children.length === 0
      }
      // 单条件节点不视为空
      if (group.type === 'condition') {
        return !group.value
      }
    }
    return false
  })
  if (buyLength === 0 || sellLength === 0 || hasInvalidGroup(buyConditions) || hasInvalidGroup(sellConditions)) {
    return []
  }

  let buyStep = 0,
    sellStep = 0,
    hold = false

  // 统一的组评估函数：支持旧数组结构和新树结构
  const evalGroup = (group, index, curDayTime) => {
    // 建立多周期上下文
    const datasets = {
      day: dayLineWithMetric,
      week: weekLineWithMetric,
      hour: hourLineWithMetric
    }
    
    // 获取当前时间戳
    const targetTime = new Date(curDayTime).getTime()
    
    // 查找周线索引：找 time <= targetTime 的最后一个周线
    let weekIndex = -1
    if (weekLineWithMetric && weekLineWithMetric.data) {
      for (let i = weekLineWithMetric.data.length - 1; i >= 0; i--) {
        if (new Date(weekLineWithMetric.data[i].time).getTime() <= targetTime) {
          weekIndex = i
          break
        }
      }
    }
    
    // 查找小时线索引：找 time 的日期与 targetTime 同一天，且时间最晚的那根；如果当天没有，找最近的前一天的最后一根
    let hourIndex = -1
    if (hourLineWithMetric && hourLineWithMetric.data) {
      // 在小时线中寻找 time <= targetTime + (24*3600*1000 - 1) 的最新一根，即当前日期的最后一条小时线
      const endOfDay = targetTime + 24 * 3600 * 1000 - 1
      for (let i = hourLineWithMetric.data.length - 1; i >= 0; i--) {
        if (new Date(hourLineWithMetric.data[i].time).getTime() <= endOfDay) {
          hourIndex = i
          break
        }
      }
    }
    
    const indices = {
      day: index,
      week: weekIndex,
      hour: hourIndex
    }
    
    const context = { datasets, indices }

    if (Array.isArray(group)) {
      // 旧结构：数组 ['COND_A','COND_B'] -> 全部满足，旧结构默认只支持日线
      return group.every((conditionType) => {
        const cond = algorithmMap[conditionType]
        if (!cond || typeof cond.func !== 'function') return false
        try {
          return Boolean(cond.func(index, dayLineWithMetric))
        } catch (error) {
          return false
        }
      })
    }
    // 新结构（树）：根节点可能是group或condition
    if (group && typeof group === 'object') {
      return evaluateConditionTree(group, context)
    }
    return false
  }

  const signals = dayLineWithMetric.data.reduce((prev, cur, index) => {
    if (buyStep < buyLength && !hold) {
      const buyResult = evalGroup(buyConditions[buyStep], index, cur.time)
      if (buyResult) {
        buyStep++
      }
      if (buyStep === buyLength) {
        hold = true
        buyStep = 0
        prev.push({
          index,
          time: cur.time,
          type: 'buy',
          price: cur.close
        })
      }
    }
    if (sellStep < sellLength && hold) {
      const sellResult = evalGroup(sellConditions[sellStep], index, cur.time)
      if (sellResult) {
        sellStep++
      }
      if (sellStep === sellLength) {
        sellStep = 0
        hold = false
        prev.push({
          index,
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

/**
 * 前复权计算函数
 * @param {Array} dayLineData - 日线数据 [{time, open, close, high, low, volume, ...}, ...]
 * @param {Array} adjustFactorData - 复权因子数据 [{time, foreAdjustFactor, backAdjustFactor, adjustFactor}, ...]
 * @returns {Array} 前复权后的日线数据
 */
export function calculateForwardAdjusted(dayLineData = [], adjustFactorData = []) {
  if (!dayLineData || dayLineData.length === 0) {
    return []
  }
  
  if (!adjustFactorData || adjustFactorData.length === 0) {
    // 如果没有复权数据，直接返回原数据
    return dayLineData
  }
  
  const normalizedFactors = [...adjustFactorData]
    .filter(item => item && item.time)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
  
  if (normalizedFactors.length === 0) {
    return dayLineData
  }

  // 为了线性扫描复权因子，先按时间升序处理日线，最后再还原原顺序
  const indexedLine = dayLineData.map((item, index) => ({ item: { ...item }, index }))
  indexedLine.sort((a, b) => new Date(a.item.time).getTime() - new Date(b.item.time).getTime())

  let factorPointer = 0
  let currentFactor = Number(normalizedFactors[0]?.foreAdjustFactor)
  currentFactor = Number.isFinite(currentFactor) && currentFactor > 0 ? currentFactor : 1

  for (let i = 0; i < indexedLine.length; i++) {
    const currentTime = new Date(indexedLine[i].item.time).getTime()
    if (!Number.isFinite(currentTime)) continue

    while (
      factorPointer < normalizedFactors.length &&
      new Date(normalizedFactors[factorPointer].time).getTime() <= currentTime
    ) {
      const nextFactor = Number(normalizedFactors[factorPointer]?.foreAdjustFactor)
      if (Number.isFinite(nextFactor) && nextFactor > 0) {
        currentFactor = nextFactor
      }
      factorPointer += 1
    }

    indexedLine[i].item.close = new Decimal(indexedLine[i].item.close).mul(currentFactor).toNumber()
    indexedLine[i].item.open = new Decimal(indexedLine[i].item.open).mul(currentFactor).toNumber()
    indexedLine[i].item.high = new Decimal(indexedLine[i].item.high).mul(currentFactor).toNumber()
    indexedLine[i].item.low = new Decimal(indexedLine[i].item.low).mul(currentFactor).toNumber()
  }

  const resultData = new Array(dayLineData.length)
  indexedLine.forEach(({ item, index }) => {
    resultData[index] = item
  })
  
  return resultData
}

export function calculateIndicator(dayLineData = [], indicatorSettings = []) {
  let result = {
    line: dayLineData,
    data: dayLineData
  }
  if (!dayLineData || dayLineData.length === 0) {
    return result
  }
  indicatorSettings.forEach((setting) => {
    const { code, calcMethod, calcParams } = setting
    if (indicatorMap[calcMethod]) {
      result[code] = indicatorMap[calcMethod].func(result, calcParams)
    }
  })
  return result
}
export const indicatorFunc = [{
  name: 'getData',
  label: '获取数据',
  func: ({line}, {dataField}) => {
    return line.map((item) => item[dataField])
  }
}, {
  // 对比计算
  name: 'compare',
  label: '对比计算',
  func: (indicator, {timeA, indicatorA, operator, timeB, indicatorB}) => {
    return indicator[indicatorA].map((item, i) => {
      return new Decimal(indicator[indicatorA][i-timeA])[operator](indicator[indicatorB][i-timeB])
    })
  }
}, {
  name: 'calculateMA',
  label: '计算平均数',
  func: (indicator, {indicatorField, days}) => {
    return calculateMA(indicator[indicatorField], days)
  }
}, {
  name: 'calculateEMA',
  label: '计算移动平均数',
  func: (indicator, {indicatorField, days}) => {
    return calculateEMA(indicator[indicatorField], days)
  }
}]
export const indicatorMap = indicatorFunc.reduce((prev, cur) => {
  prev[cur.name] = cur
  return prev
}, {})
