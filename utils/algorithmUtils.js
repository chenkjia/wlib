
// 算法工具函数

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

const historicalHighPrefixCache = new WeakMap()

function getHistoricalHighPrefix(line = []) {
  if (!Array.isArray(line) || line.length === 0) return []
  const cached = historicalHighPrefixCache.get(line)
  if (cached) return cached
  const prefix = new Array(line.length).fill(-Infinity)
  let runningMax = -Infinity
  for (let i = 0; i < line.length; i++) {
    const high = Number(line[i]?.high ?? line[i]?.close)
    if (isFiniteNumber(high) && high > runningMax) {
      runningMax = high
    }
    prefix[i] = runningMax
  }
  historicalHighPrefixCache.set(line, prefix)
  return prefix
}

function isGoldenCross(i, dif = [], dea = []) {
  if (i <= 0) return false
  const prevDif = Number(dif[i - 1])
  const prevDea = Number(dea[i - 1])
  const curDif = Number(dif[i])
  const curDea = Number(dea[i])
  if (![prevDif, prevDea, curDif, curDea].every(isFiniteNumber)) return false
  return prevDif < prevDea && curDif >= curDea
}

function isDeadCross(i, dif = [], dea = []) {
  if (i <= 0) return false
  const prevDif = Number(dif[i - 1])
  const prevDea = Number(dea[i - 1])
  const curDif = Number(dif[i])
  const curDea = Number(dea[i])
  if (![prevDif, prevDea, curDif, curDea].every(isFiniteNumber)) return false
  return prevDif > prevDea && curDif <= curDea
}

function isMacdBottomDeviation(index, line = [], dif = [], dea = []) {
  if (!Array.isArray(line) || !Array.isArray(dif) || !Array.isArray(dea) || index <= 0) return false
  // 仅在当前是金叉时判定底背离
  if (!isGoldenCross(index, dif, dea)) return false

  // 找上一个金叉
  let prevGolden = -1
  for (let i = index - 1; i >= 1; i--) {
    if (isGoldenCross(i, dif, dea)) {
      prevGolden = i
      break
    }
  }
  if (prevGolden === -1) return false

  // 两次金叉中间所有死叉的DIF都必须在零轴下
  const deadBetween = []
  for (let i = prevGolden + 1; i < index; i++) {
    if (isDeadCross(i, dif, dea)) deadBetween.push(i)
  }
  if (deadBetween.length === 0) return false
  if (!deadBetween.every(i => Number(dif[i]) < 0)) return false

  const prevGoldenDif = Number(dif[prevGolden])
  const currGoldenDif = Number(dif[index])
  const prevPrice = Number(line[prevGolden]?.close)
  const currPrice = Number(line[index]?.close)
  if (![prevGoldenDif, currGoldenDif, prevPrice, currPrice].every(isFiniteNumber)) return false

  return currGoldenDif > prevGoldenDif && currPrice < prevPrice
}

function isMacdTopDeviation(index, line = [], dif = [], dea = []) {
  if (!Array.isArray(line) || !Array.isArray(dif) || !Array.isArray(dea) || index <= 0) return false
  // 仅在当前是死叉时判定顶背离
  if (!isDeadCross(index, dif, dea)) return false

  // 找上一个死叉
  let prevDead = -1
  for (let i = index - 1; i >= 1; i--) {
    if (isDeadCross(i, dif, dea)) {
      prevDead = i
      break
    }
  }
  if (prevDead === -1) return false

  // 两次死叉中间所有金叉的DIF都必须在零轴上
  const goldenBetween = []
  for (let i = prevDead + 1; i < index; i++) {
    if (isGoldenCross(i, dif, dea)) goldenBetween.push(i)
  }
  if (goldenBetween.length === 0) return false
  if (!goldenBetween.every(i => Number(dif[i]) > 0)) return false

  const prevDeadDif = Number(dif[prevDead])
  const currDeadDif = Number(dif[index])
  const prevPrice = Number(line[prevDead]?.close)
  const currPrice = Number(line[index]?.close)
  if (![prevDeadDif, currDeadDif, prevPrice, currPrice].every(isFiniteNumber)) return false

  return currDeadDif < prevDeadDif && currPrice > prevPrice
}

// 可用条件列表
const availableConditions = [
  // 短期与中期均线对比
  { 
    value: 'MAS_GT_MAM', 
    label: '短期均线高于中期均线', 
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i] > maM[i]
  },
  { 
    value: 'MAS_LT_MAM', 
    label: '短期均线低于中期均线',
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i] < maM[i]
  },
  { 
    value: 'MAS_CROSS_UP_MAM', 
    label: '短期均线上穿中期均线',
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i-1] < maM[i-1] && maS[i] >= maM[i]
  },
  { 
    value: 'MAS_CROSS_DOWN_MAM', 
    label: '短期均线下穿中期均线',
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i-1] > maM[i-1] && maS[i] <= maM[i]
  },
  
  // 中期与长期均线对比
  { 
    value: 'MAM_GT_MAL', 
    label: '中期均线高于长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i] > maL[i]
  },
  { 
    value: 'MAM_LT_MAL', 
    label: '中期均线低于长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i] < maL[i]
  },
  { 
    value: 'MAM_CROSS_UP_MAL', 
    label: '中期均线上穿长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i-1] < maL[i-1] && maM[i] >= maL[i]
  },
  { 
    value: 'MAM_CROSS_DOWN_MAL', 
    label: '中期均线下穿长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i-1] > maL[i-1] && maM[i] <= maL[i]
  },
  
  // 长期与超长期均线对比
  { 
    value: 'MAL_GT_MAX', 
    label: '长期均线高于超长期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i] > maX[i]
  },
  { 
    value: 'MAL_LT_MAX', 
    label: '长期均线低于超长期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i] < maX[i]
  },
  { 
    value: 'MAL_CROSS_UP_MAX', 
    label: '长期均线上穿超长期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i-1] < maX[i-1] && maL[i] >= maX[i]
  },
  { 
    value: 'MAL_CROSS_DOWN_MAX', 
    label: '长期均线下穿超长期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i-1] > maX[i-1] && maL[i] <= maX[i]
  },
  
  // 成交量相关
  { 
    value: 'VOLUME_HIGH', 
    label: '成交量放大',
    func: (i, {volume}) => volume[i] > volume[i-1] * 1.1
  },
  { 
    value: 'VOLUME_LOW', 
    label: '成交量缩小',
    func: (i, {volume}) => volume[i] < volume[i-1] * 0.9
  },
  {
    value: 'VOLUME_MA_S_UP',
    label: '短期交易量均线向上',
    func: (i, {volumeMaS}) => i >= 2 && Number(volumeMaS?.[i - 2]) < Number(volumeMaS?.[i - 1]) && Number(volumeMaS?.[i - 1]) < Number(volumeMaS?.[i])
  },
  {
    value: 'VOLUME_MA_L_UP',
    label: '长期交易量均线向上',
    func: (i, {volumeMaL}) => i >= 2 && Number(volumeMaL?.[i - 2]) < Number(volumeMaL?.[i - 1]) && Number(volumeMaL?.[i - 1]) < Number(volumeMaL?.[i])
  },
  {
    value: 'VOLUME_MA_S_GT_L',
    label: '短期交易量均线在长期交易量均线之上',
    func: (i, {volumeMaS, volumeMaL}) => Number(volumeMaS?.[i]) > Number(volumeMaL?.[i])
  },
  
  // macd相关
  { 
    value: 'MACD_DIF_GT_DEA', 
    label: 'MACD DIF大于DEA (多头)',
    params: ['macd'],
    func: (i, {dif, dea}) => dif[i] > dea[i]
  },
  {
    value: 'MACD_DIF_GT_ZERO',
    label: 'MACD DIF大于0轴',
    params: ['macd'],
    func: (i, {dif}) => dif[i] > 0
  },
  {
    value: 'MACD_DIF_ABS_LT_1',
    label: 'MACD DIF绝对值小于1（低位）',
    params: ['macd'],
    func: (i, {dif}) => Math.abs(Number(dif[i])) < 1
  },
  {
    value: 'MACD_DIF_ABS_GT_10',
    label: 'MACD DIF绝对值大于10（高位）',
    params: ['macd'],
    func: (i, {dif}) => Math.abs(Number(dif[i])) > 10
  },
  {
    value: 'MACD_DIF_LTE_5',
    label: 'MACD DIF不超过5',
    params: ['macd'],
    func: (i, {dif}) => Number(dif[i]) <= 5
  },
  {
    value: 'MACD_GREEN_BAR_PULL_LEG',
    label: 'MACD 绿柱抽脚',
    params: ['macd'],
    func: (i, {bar}) => i > 0 && Number(bar[i]) < 0 && Number(bar[i - 1]) < 0 && Math.abs(Number(bar[i])) < Math.abs(Number(bar[i - 1]))
  },
  {
    value: 'MACD_RED_BAR_SHRINK_HEAD',
    label: 'MACD 红柱缩头',
    params: ['macd'],
    func: (i, {bar}) => i > 0 && Number(bar[i]) > 0 && Number(bar[i - 1]) > 0 && Math.abs(Number(bar[i])) < Math.abs(Number(bar[i - 1]))
  },
  {
    value: 'MACD_BAR_ABS_GT_5',
    label: 'MACD 柱绝对值大于5',
    params: ['macd'],
    func: (i, {bar}) => Math.abs(Number(bar[i])) > 5
  },
  { 
    value: 'MACD_DIF_LT_DEA', 
    label: 'MACD DIF小于DEA (空头)',
    params: ['macd'],
    func: (i, {dif, dea}) => dif[i] < dea[i]
  },
  { 
    value: 'MACD_CROSS_UP_GOLDEN', 
    label: 'macd金叉',
    params: ['macd'],
    func: (i, {dif, dea}) => dif[i-1] < dea[i-1] && dif[i] >= dea[i] && (dea[i-1] <= 0 || Math.abs(dea[i-1]) < 0.05)
  },
  { 
    value: 'MACD_CROSS_DOWN_DEAD', 
    label: 'macd死叉',
    params: ['macd'],
    func: (i, {dif, dea}) => dif[i-1] > dea[i-1] && dif[i] <= dea[i] && (dea[i-1] >= 0 || Math.abs(dea[i-1]) < 0.05)
  },
  { 
    value: 'MACD_BOTTOM_DEVIATION', 
    label: 'macd底背离',
    params: ['macd'],
    func: (i, {dif, dea, line}) => isMacdBottomDeviation(i, line, dif, dea)
  },
  { 
    value: 'MACD_TOP_DEVIATION', 
    label: 'macd顶背离',
    params: ['macd'],
    func: (i, {dif, dea, line}) => isMacdTopDeviation(i, line, dif, dea)
  },

  // BIAS相关
  {
    value: 'BIAS_S_GT_ZERO',
    label: 'BIAS 短期大于0',
    params: ['bias'],
    func: (i, {biasS}) => Number(biasS?.[i]) > 0
  },
  {
    value: 'BIAS_S_LT_ZERO',
    label: 'BIAS 短期小于0',
    params: ['bias'],
    func: (i, {biasS}) => Number(biasS?.[i]) < 0
  },
  {
    value: 'BIAS_S_LT_NEG_10',
    label: 'BIAS 短期小于-10',
    params: ['bias'],
    func: (i, {biasS}) => Number(biasS?.[i]) < -10
  },
  {
    value: 'BIAS_S_LT_NEG_15',
    label: 'BIAS 短期小于-15',
    params: ['bias'],
    func: (i, {biasS}) => Number(biasS?.[i]) < -15
  },
  {
    value: 'BIAS_S_ABS_LT_5',
    label: 'BIAS 短期绝对值小于5',
    params: ['bias'],
    func: (i, {biasS}) => Math.abs(Number(biasS?.[i])) < 5
  },
  {
    value: 'BIAS_S_ABS_GT_10',
    label: 'BIAS 短期绝对值大于10',
    params: ['bias'],
    func: (i, {biasS}) => Math.abs(Number(biasS?.[i])) > 10
  },
  {
    value: 'BIAS_S_CROSS_UP_ZERO',
    label: 'BIAS 短期上穿0轴',
    params: ['bias'],
    func: (i, {biasS}) => i > 0 && Number(biasS?.[i - 1]) <= 0 && Number(biasS?.[i]) > 0
  },
  {
    value: 'BIAS_S_CROSS_DOWN_ZERO',
    label: 'BIAS 短期下穿0轴',
    params: ['bias'],
    func: (i, {biasS}) => i > 0 && Number(biasS?.[i - 1]) >= 0 && Number(biasS?.[i]) < 0
  },
  {
    value: 'BIAS_S_GT_M',
    label: 'BIAS 短期大于中期',
    params: ['bias'],
    func: (i, {biasS, biasM}) => Number(biasS?.[i]) > Number(biasM?.[i])
  },
  {
    value: 'BIAS_S_LT_M',
    label: 'BIAS 短期小于中期',
    params: ['bias'],
    func: (i, {biasS, biasM}) => Number(biasS?.[i]) < Number(biasM?.[i])
  },
  {
    value: 'BIAS_M_LT_NEG_20',
    label: 'BIAS 中期小于-20',
    params: ['bias'],
    func: (i, {biasM}) => Number(biasM?.[i]) < -20
  },
  {
    value: 'BIAS_M_LT_NEG_25',
    label: 'BIAS 中期小于-25',
    params: ['bias'],
    func: (i, {biasM}) => Number(biasM?.[i]) < -25
  },
  {
    value: 'BIAS_M_GT_L',
    label: 'BIAS 中期大于长期',
    params: ['bias'],
    func: (i, {biasM, biasL}) => Number(biasM?.[i]) > Number(biasL?.[i])
  },
  {
    value: 'BIAS_M_LT_L',
    label: 'BIAS 中期小于长期',
    params: ['bias'],
    func: (i, {biasM, biasL}) => Number(biasM?.[i]) < Number(biasL?.[i])
  },
  {
    value: 'BIAS_L_LT_NEG_25',
    label: 'BIAS 长期小于-25',
    params: ['bias'],
    func: (i, {biasL}) => Number(biasL?.[i]) < -25
  },
  {
    value: 'BIAS_L_LT_NEG_30',
    label: 'BIAS 长期小于-30',
    params: ['bias'],
    func: (i, {biasL}) => Number(biasL?.[i]) < -30
  },

  // kdj相关
  { 
    value: 'KDJ_OVERBOUGHT', 
    label: 'KDJ 超买（K、D > 80）',
    params: ['kdj'],
    func: (i, {kdjK, kdjD}) => kdjK[i] > 80 && kdjD[i] > 80
  },
  { 
    value: 'KDJ_OVERSOLD', 
    label: 'KDJ 超卖（K、D < 20）',
    params: ['kdj'],
    func: (i, {kdjK, kdjD}) => kdjK[i] < 20 && kdjD[i] < 20
  },

  // 其他指标
  { 
    value: 'SIGN1', 
    label: 'sign1小于50',
    params: ['ma'],
    func: (i, {sign1}) => sign1[i] < 50
  },
  { 
    value: 'MAS_UP', 
    label: '短期均线向上',
    params: ['ma'],
    func: (i, {maS}) => maS[i-2] < maS[i-1] && maS[i-1] < maS[i]
  },
  { 
    value: 'MAS_DOWN', 
    label: '短期均线向下',
    params: ['ma'],
    func: (i, {maS}) => maS[i-2] > maS[i-1] && maS[i-1] > maS[i]
  },
  { 
    value: 'MAM_UP', 
    label: '中期均线向上',
    params: ['ma'],
    func: (i, {maM}) => maM[i-2] < maM[i-1] && maM[i-1] < maM[i]
  },
  { 
    value: 'MAM_DOWN', 
    label: '中期均线向下',
    params: ['ma'],
    func: (i, {maM}) => maM[i-2] > maM[i-1] && maM[i-1] > maM[i]
  },
  { 
    value: 'MAL_UP', 
    label: '长期均线向上',
    params: ['ma'],
    func: (i, {maL}) => maL[i-2] < maL[i-1] && maL[i-1] < maL[i]
  },
  { 
    value: 'MAL_DOWN', 
    label: '长期均线向下',
    params: ['ma'],
    func: (i, {maL}) => maL[i-2] > maL[i-1] && maL[i-1] > maL[i]
  },
  { 
    value: 'MAX_UP', 
    label: '远期均线向上',
    params: ['ma'],
    func: (i, {maX}) => maX[i-2] < maX[i-1] && maX[i-1] < maX[i]
  },
  { 
    value: 'MAX_DOWN', 
    label: '远期均线向下',
    params: ['ma'],
    func: (i, {maX}) => maX[i-2] > maX[i-1] && maX[i-1] > maX[i]
  },
  { 
    value: 'MAS_UPTREND', 
    label: '短期均线拐头向上',
    params: ['ma'],
    func: (i, {maS}) => maS[i-2] > maS[i-1] && maS[i] > maS[i-1]
  },
  { 
    value: 'MAS_DOWNTREND', 
    label: '短期均线拐头向下',
    params: ['ma'],
    func: (i, {maS}) => maS[i-2] < maS[i-1] && maS[i] < maS[i-1]
  },
  { 
    value: 'MAM_UPTREND', 
    label: '中期均线拐头向上',
    params: ['ma'],
    func: (i, {maM}) => maM[i-2] > maM[i-1] && maM[i] > maM[i-1]
  },
  { 
    value: 'MAM_DOWNTREND', 
    label: '中期均线拐头向下',
    params: ['ma'],
    func: (i, {maM}) => maM[i-2] < maM[i-1] && maM[i] < maM[i-1]
  },
  { 
    value: 'MAL_UPTREND', 
    label: '长期均线拐头向上',
    params: ['ma'],
    func: (i, {maL}) => maL[i-2] > maL[i-1] && maL[i] > maL[i-1]
  },
  { 
    value: 'MAL_DOWNTREND', 
    label: '长期均线拐头向下',
    params: ['ma'],
    func: (i, {maL}) => maL[i-2] < maL[i-1] && maL[i] < maL[i-1]
  },
  { 
    value: 'MAX_UPTREND', 
    label: '远期均线拐头向上',
    params: ['ma'],
    func: (i, {maX}) => maX[i-2] > maX[i-1] && maX[i] > maX[i-1]
  },
  { 
    value: 'MAX_DOWNTREND', 
    label: '远期均线拐头向下',
    params: ['ma'],
    func: (i, {maX}) => maX[i-2] < maX[i-1] && maX[i] < maX[i-1]
  },
  {
    value: 'CLOSE_GT_MAS',
    label: '收盘价高于短期均线',
    params: ['ma'],
    func: (i, {line, maS}) => line[i]?.close > maS[i]
  },
  {
    value: 'CLOSE_GT_MAM',
    label: '收盘价高于中期均线',
    params: ['ma'],
    func: (i, {line, maM}) => line[i]?.close > maM[i]
  },
  {
    value: 'CLOSE_GT_MAL',
    label: '收盘价高于长期均线',
    params: ['ma'],
    func: (i, {line, maL}) => line[i]?.close > maL[i]
  },
  {
    value: 'CLOSE_GT_MAX',
    label: '收盘价高于超长期均线',
    params: ['ma'],
    func: (i, {line, maX}) => line[i]?.close > maX[i]
  },
  {
    value: 'MA_CLUSTERED_WITH_PRICE',
    label: '均线密集（价+四均线最大最小差≤3%）',
    params: ['ma'],
    func: (i, {line, maS, maM, maL, maX}) => {
      const values = [
        Number(line?.[i]?.close),
        Number(maS?.[i]),
        Number(maM?.[i]),
        Number(maL?.[i]),
        Number(maX?.[i])
      ]
      if (!values.every(isFiniteNumber)) return false
      const minValue = Math.min(...values)
      const maxValue = Math.max(...values)
      if (!isFiniteNumber(minValue) || minValue <= 0) return false
      return ((maxValue - minValue) / minValue) * 100 <= 3
    }
  },
  {
    value: 'PRICE_BREAK_ALL_TIME_HIGH_IN_3D',
    label: '三天内价格突破历史最高价',
    params: ['line'],
    func: (i, {line}) => {
      if (!Array.isArray(line) || i < 0) return false
      const prefix = getHistoricalHighPrefix(line)
      const start = Math.max(0, i - 2)
      for (let j = start; j <= i; j++) {
        const cur = Number(line[j]?.high ?? line[j]?.close)
        if (!isFiniteNumber(cur) || j <= 0) continue
        const prevHigh = prefix[j - 1]
        if (isFiniteNumber(prevHigh) && cur > prevHigh) {
          return true
        }
      }
      return false
    }
  },
  {
    value: 'PRICE_BREAK_ALL_TIME_HIGH_TODAY',
    label: '当天突破历史最高价',
    params: ['line'],
    func: (i, {line}) => {
      if (!Array.isArray(line) || i <= 0) return false
      const prefix = getHistoricalHighPrefix(line)
      const cur = Number(line[i]?.high ?? line[i]?.close)
      const prevHigh = prefix[i - 1]
      if (!isFiniteNumber(cur) || !isFiniteNumber(prevHigh)) return false
      return cur > prevHigh
    }
  },
  { 
    value: 'MAS_EXPEND_MAM', 
    label: '短期均线扩大中期均线',
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i]-maS[i-1] > maM[i]-maM[i-1]
  },
  { 
    value: 'MAS_CONTRACT_MAM', 
    label: '短期均线缩小中期均线',
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i]-maS[i-1] < maM[i]-maM[i-1]
  },
  { 
    value: 'MAM_EXPEND_MAL', 
    label: '中期均线扩大长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i]-maM[i-1] > maL[i]-maL[i-1]
  },
  { 
    value: 'MAM_CONTRACT_MAL', 
    label: '中期均线缩小长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i]-maM[i-1] < maL[i]-maL[i-1]
  },
  { 
    value: 'MAL_EXPEND_MAX', 
    label: '长期均线扩大远期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i]-maL[i-1] > maX[i]-maX[i-1]
  },
  { 
    value: 'MAL_CONTRACT_MAX', 
    label: '长期均线缩小远期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i]-maL[i-1] < maX[i]-maX[i-1]
  },
]

// 创建algorithmMap对象，从availableConditions中提取函数
const algorithmMap = {}
availableConditions.forEach(condition => {
  algorithmMap[condition.value] = condition
})

// 条件树执行函数 - 使用algorithmMap优化性能
function evaluateConditionTree(node, contextOrData, indexOrUndefined) {
  const isLegacy = indexOrUndefined !== undefined
  if (isLegacy && (!contextOrData || typeof contextOrData !== 'object')) {
    throw new Error('旧调用方式已废弃，请使用新的context对象')
  }

  const runConditionSafely = (condition, index, data) => {
    if (!condition || typeof condition.func !== 'function') return false
    try {
      return Boolean(condition.func(index, data))
    } catch (error) {
      return false
    }
  }
  
  if (node.type === 'condition') {
    const condition = algorithmMap[node.value]
    
    if (isLegacy) {
      return runConditionSafely(condition, indexOrUndefined, contextOrData)
    } else {
      if (!contextOrData || typeof contextOrData !== 'object') return false
      if (!contextOrData.datasets || !contextOrData.indices) return false
      const timeframe = node.timeframe || 'day'
      const data = contextOrData.datasets[timeframe]
      const index = contextOrData.indices[timeframe]
      
      if (!data || index === -1 || index === undefined) return false
      return runConditionSafely(condition, index, data)
    }
  }
  
  if (node.type === 'group') {
    const results = node.children.map(child => 
      evaluateConditionTree(child, contextOrData, indexOrUndefined)
    )
    
    switch (node.op) {
      case 'AND': return results.every(Boolean)
      case 'OR': return results.some(Boolean) 
      case 'NOT': return !results[0]
      default: return false
    }
  }
  
  return false
}

export { availableConditions, algorithmMap, evaluateConditionTree }
