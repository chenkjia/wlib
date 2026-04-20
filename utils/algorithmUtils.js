
// 算法工具函数

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value)
}

function findRecentPivotIndices(series = [], endIndex = 0, pivotType = 'low', lookback = 120, leftRight = 2) {
  if (!Array.isArray(series) || series.length === 0) return []
  const start = Math.max(leftRight, endIndex - lookback + 1)
  const end = Math.min(endIndex, series.length - 1 - leftRight)
  if (end < start) return []

  const pivots = []
  for (let i = start; i <= end; i++) {
    const center = series[i]
    if (!isFiniteNumber(center)) continue
    let isPivot = true
    for (let offset = 1; offset <= leftRight; offset++) {
      const left = series[i - offset]
      const right = series[i + offset]
      if (!isFiniteNumber(left) || !isFiniteNumber(right)) {
        isPivot = false
        break
      }
      if (pivotType === 'low') {
        if (!(center <= left && center <= right)) {
          isPivot = false
          break
        }
      } else {
        if (!(center >= left && center >= right)) {
          isPivot = false
          break
        }
      }
    }
    if (isPivot) pivots.push(i)
  }

  return pivots
}

function isMacdBottomDeviation(index, line = [], dif = []) {
  if (!Array.isArray(line) || !Array.isArray(dif) || index < 4) return false
  const lowSeries = line.map(item => Number(item?.low))
  const pivots = findRecentPivotIndices(lowSeries, index, 'low', 180, 2)
  if (pivots.length < 2) return false
  const prev = pivots[pivots.length - 2]
  const curr = pivots[pivots.length - 1]
  if (curr !== index) return false
  const prevLow = lowSeries[prev]
  const currLow = lowSeries[curr]
  const prevDif = Number(dif[prev])
  const currDif = Number(dif[curr])
  if (![prevLow, currLow, prevDif, currDif].every(isFiniteNumber)) return false
  return currLow < prevLow && currDif > prevDif && currDif < 0 && prevDif < 0
}

function isMacdTopDeviation(index, line = [], dif = []) {
  if (!Array.isArray(line) || !Array.isArray(dif) || index < 4) return false
  const highSeries = line.map(item => Number(item?.high))
  const pivots = findRecentPivotIndices(highSeries, index, 'high', 180, 2)
  if (pivots.length < 2) return false
  const prev = pivots[pivots.length - 2]
  const curr = pivots[pivots.length - 1]
  if (curr !== index) return false
  const prevHigh = highSeries[prev]
  const currHigh = highSeries[curr]
  const prevDif = Number(dif[prev])
  const currDif = Number(dif[curr])
  if (![prevHigh, currHigh, prevDif, currDif].every(isFiniteNumber)) return false
  return currHigh > prevHigh && currDif < prevDif && currDif > 0 && prevDif > 0
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
    func: (i, {dif, line}) => isMacdBottomDeviation(i, line, dif)
  },
  { 
    value: 'MACD_TOP_DEVIATION', 
    label: 'macd顶背离',
    params: ['macd'],
    func: (i, {dif, line}) => isMacdTopDeviation(i, line, dif)
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
