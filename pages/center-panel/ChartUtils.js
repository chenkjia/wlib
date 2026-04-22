/**
 * K线图相关工具函数
 */

// 颜色配置
export const upColor = '#ef4444'
export const downColor = '#22c55e'

function calculateSimpleMA(values = [], period = 60) {
  if (!Array.isArray(values) || values.length === 0) return []
  const result = []
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - period + 1)
    const window = values.slice(start, i + 1).filter(v => typeof v === 'number' && Number.isFinite(v))
    if (window.length === 0) {
      result.push(null)
      continue
    }
    const sum = window.reduce((acc, cur) => acc + cur, 0)
    result.push(sum / window.length)
  }
  return result
}

function getTrendStateByIndex(closeSeries = [], ma60Series = [], difSeries = [], index = 0) {
  // 数据前段（MA60不足或无法比较前一日）统一归为震荡
  if (index < 60) return 'range'
  const close = Number(closeSeries[index])
  const ma60 = Number(ma60Series[index])
  const ma60Prev = Number(ma60Series[index - 1])
  const dif = Number(difSeries[index])
  if (!Number.isFinite(close) || !Number.isFinite(ma60) || !Number.isFinite(ma60Prev) || !Number.isFinite(dif)) {
    return 'range'
  }
  if (close > ma60 && ma60 > ma60Prev && dif > 0) return 'bull'
  if (close < ma60 && ma60 < ma60Prev && dif < 0) return 'bear'
  return 'range'
}

function buildTrendSegments(lineData = [], difSeries = [], categoryData = []) {
  if (!Array.isArray(lineData) || lineData.length === 0) return []
  const closeSeries = lineData.map(item => (typeof item?.close === 'number' ? item.close : null))
  const ma60Series = calculateSimpleMA(closeSeries, 60)
  const states = lineData.map((_, index) => getTrendStateByIndex(closeSeries, ma60Series, difSeries, index))
  const segments = []
  let start = 0
  let currentState = states[0] || 'range'
  for (let i = 1; i < states.length; i++) {
    if (states[i] !== currentState) {
      segments.push({
        state: currentState,
        startIndex: start,
        endIndex: i - 1,
        startX: categoryData[start],
        endX: categoryData[i - 1]
      })
      start = i
      currentState = states[i]
    }
  }
  segments.push({
    state: currentState,
    startIndex: start,
    endIndex: states.length - 1,
    startX: categoryData[start],
    endX: categoryData[states.length - 1]
  })
  return segments
}

/**
 * 分割K线图数据
 * @param {Array} rawData - 原始数据
 * @returns {Object} 分割后的数据
 */
export function splitData(rawData = [], transactions = []) {
  const categoryData = rawData.map(item => item.time)
  const values = rawData.map(item => [item.open, item.close, item.low, item.high])
  const volumes = rawData.map((item, index) => [index, item.volume, item.close > item.open ? 1 : -1])
  const trendData = transactions.map(transaction => ({
    buyIndex: rawData.findIndex(item => item.time === transaction.buyTime),
    sellIndex: rawData.findIndex(item => item.time === transaction.sellTime),
    ...transaction
  }))
  return {
    categoryData,
    values,
    volumes,
    trendData
  }
}

/**
 * 处理趋势点标记
 * @param {Array} rawData - 原始数据
 * @param {Array} goals - 目标数据
 * @param {Object} data - 分割后的数据
 * @returns {Object} 处理后的数据
 */
function processTrendPoints(trendData) {
  const trendType = ['buy', 'sell']
  const trendPoints = trendData.reduce((acc, transaction, index) => ([
    ...acc,
    ...trendType.map(type => ({
      name: `${type}${index + 1}`,
      coord: [transaction[type + 'Index'], transaction[type + 'Price']],
      value: `${type.toUpperCase()}: ${transaction[type + 'Price']}`,
      itemStyle: { color: type === 'buy' ? '#00da3c' : '#ec0000' },
      symbol: 'pin',
      symbolSize: 30,
      label: {
        show: true,
        position: 'top',
        distance: 10,
        formatter: type === 'buy' ? '买' : '卖',
        fontSize: 12,
        color: '#fff',
        backgroundColor: type === 'buy' ? '#00da3c' : '#ec0000',
        padding: 3,
        borderRadius: 3
      }
    }))
  ]), [])
  return trendPoints
}

function processMagicNinePoints(lineData = []) {
  const rawUpCounts = new Array(lineData.length).fill(0)
  const rawDownCounts = new Array(lineData.length).fill(0)
  const upSequences = []
  const downSequences = []
  let activeUpSequence = null
  let activeDownSequence = null
  for (let i = 4; i < lineData.length; i++) {
    const currentClose = lineData[i]?.close
    const compareClose = lineData[i - 4]?.close
    if (typeof currentClose !== 'number' || typeof compareClose !== 'number') {
      activeUpSequence = null
      activeDownSequence = null
      continue
    }
    if (currentClose > compareClose) {
      rawUpCounts[i] = rawUpCounts[i - 1] >= 9 ? 1 : rawUpCounts[i - 1] + 1
      rawDownCounts[i] = 0
      activeDownSequence = null
    } else if (currentClose < compareClose) {
      rawDownCounts[i] = rawDownCounts[i - 1] >= 9 ? 1 : rawDownCounts[i - 1] + 1
      rawUpCounts[i] = 0
      activeUpSequence = null
    } else {
      rawUpCounts[i] = 0
      rawDownCounts[i] = 0
      activeUpSequence = null
      activeDownSequence = null
    }
    if (rawUpCounts[i] > 0) {
      if (!activeUpSequence) {
        activeUpSequence = { points: [], maxCount: 0, endIndex: i }
        upSequences.push(activeUpSequence)
      }
      const low = lineData[i]?.low
      const point = {
        name: `magic9-up-${i}`,
        coord: [i, typeof low === 'number' ? low * 0.995 : currentClose],
        value: String(rawUpCounts[i]),
        symbol: 'circle',
        symbolSize: 1,
        itemStyle: { color: '#22c55e' },
        label: {
          show: true,
          position: 'bottom',
          distance: 4,
          formatter: String(rawUpCounts[i]),
          fontSize: 11,
          color: '#22c55e',
          backgroundColor: '#ffffff',
          borderColor: '#22c55e',
          borderWidth: 1,
          borderRadius: 2,
          padding: [1, 3]
        }
      }
      activeUpSequence.points.push({ ...point, dataIndex: i, count: rawUpCounts[i] })
      activeUpSequence.maxCount = Math.max(activeUpSequence.maxCount, rawUpCounts[i])
      activeUpSequence.endIndex = i
    }
    if (rawDownCounts[i] > 0) {
      if (!activeDownSequence) {
        activeDownSequence = { points: [], maxCount: 0, endIndex: i }
        downSequences.push(activeDownSequence)
      }
      const high = lineData[i]?.high
      const point = {
        name: `magic9-down-${i}`,
        coord: [i, typeof high === 'number' ? high * 1.005 : currentClose],
        value: String(rawDownCounts[i]),
        symbol: 'circle',
        symbolSize: 1,
        itemStyle: { color: '#ef4444' },
        label: {
          show: true,
          position: 'top',
          distance: 4,
          formatter: String(rawDownCounts[i]),
          fontSize: 11,
          color: '#ef4444',
          backgroundColor: '#ffffff',
          borderColor: '#ef4444',
          borderWidth: 1,
          borderRadius: 2,
          padding: [1, 3]
        }
      }
      activeDownSequence.points.push({ ...point, dataIndex: i, count: rawDownCounts[i] })
      activeDownSequence.maxCount = Math.max(activeDownSequence.maxCount, rawDownCounts[i])
      activeDownSequence.endIndex = i
    }
  }
  const allSequences = [...upSequences, ...downSequences]
  const latestEndIndex = allSequences.reduce((max, sequence) => Math.max(max, sequence.endIndex), -1)
  const visibleSequences = allSequences.filter(sequence => sequence.maxCount >= 9 || sequence.endIndex === latestEndIndex)
  const upCounts = new Array(lineData.length).fill(0)
  const downCounts = new Array(lineData.length).fill(0)
  const points = visibleSequences
    .flatMap(sequence => sequence.points)
    .sort((a, b) => a.dataIndex - b.dataIndex)
    .map(point => {
      if (point.name.startsWith('magic9-up-')) {
        upCounts[point.dataIndex] = point.count
      } else {
        downCounts[point.dataIndex] = point.count
      }
      const { dataIndex, count, ...displayPoint } = point
      return displayPoint
    })
  return { upCounts, downCounts, points }
}

function processMacdDeviationPoints(dif = [], dea = [], line = []) {
  const topPoints = []
  const bottomPoints = []
  const length = Math.min(dif.length, dea.length, line.length || Infinity)
  const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value)
  const isGoldenCross = (i) => i > 0 && isFiniteNumber(dif[i - 1]) && isFiniteNumber(dea[i - 1]) && isFiniteNumber(dif[i]) && isFiniteNumber(dea[i]) && dif[i - 1] < dea[i - 1] && dif[i] >= dea[i]
  const isDeadCross = (i) => i > 0 && isFiniteNumber(dif[i - 1]) && isFiniteNumber(dea[i - 1]) && isFiniteNumber(dif[i]) && isFiniteNumber(dea[i]) && dif[i - 1] > dea[i - 1] && dif[i] <= dea[i]

  for (let i = 1; i < length; i++) {
    // 底背离：当前金叉 vs 上一个金叉，且中间死叉DIF都在0轴下
    if (isGoldenCross(i)) {
      let prevGolden = -1
      for (let j = i - 1; j >= 1; j--) {
        if (isGoldenCross(j)) {
          prevGolden = j
          break
        }
      }
      if (prevGolden !== -1) {
        const deadBetween = []
        for (let j = prevGolden + 1; j < i; j++) {
          if (isDeadCross(j)) deadBetween.push(j)
        }
        if (deadBetween.length > 0 && deadBetween.every(j => isFiniteNumber(dif[j]) && dif[j] < 0)) {
          const prevGoldenDif = Number(dif[prevGolden])
          const currGoldenDif = Number(dif[i])
          const prevPrice = Number(line[prevGolden]?.close)
          const currPrice = Number(line[i]?.close)
          if ([prevGoldenDif, currGoldenDif, prevPrice, currPrice].every(isFiniteNumber)) {
            if (currGoldenDif > prevGoldenDif && currPrice < prevPrice) {
              bottomPoints.push([i, currGoldenDif])
            }
          }
        }
      }
    }

    // 顶背离：当前死叉 vs 上一个死叉，且中间金叉DIF都在0轴上
    if (isDeadCross(i)) {
      let prevDead = -1
      for (let j = i - 1; j >= 1; j--) {
        if (isDeadCross(j)) {
          prevDead = j
          break
        }
      }
      if (prevDead !== -1) {
        const goldenBetween = []
        for (let j = prevDead + 1; j < i; j++) {
          if (isGoldenCross(j)) goldenBetween.push(j)
        }
        if (goldenBetween.length > 0 && goldenBetween.every(j => isFiniteNumber(dif[j]) && dif[j] > 0)) {
          const prevDeadDif = Number(dif[prevDead])
          const currDeadDif = Number(dif[i])
          const prevPrice = Number(line[prevDead]?.close)
          const currPrice = Number(line[i]?.close)
          if ([prevDeadDif, currDeadDif, prevPrice, currPrice].every(isFiniteNumber)) {
            if (currDeadDif < prevDeadDif && currPrice > prevPrice) {
              topPoints.push([i, currDeadDif])
            }
          }
        }
      }
    }
  }
  return { topPoints, bottomPoints }
}

/**
 * 创建图表选项
 * @param {Object} data - 图表数据
 * @param {Object} dayLineWithMetric - 包含所有指标的日线数据
 * @param {Function} formatDateYYYYMMDD - 日期格式化函数
 * @param {Function} formatDateMMDD - 日期格式化函数
 * @returns {Object} 图表选项
 */
export function createChartOption(data, dayLineWithMetric, formatDateYYYYMMDD, formatDateMMDD, enabledIndicators = ['ma', 'macd'], activeSubChart = 'volume', simulatedBuyPoints = []) {
  const macdEnabled = enabledIndicators.includes('macd')
  const kdjEnabled = enabledIndicators.includes('kdj')
  const biasEnabled = enabledIndicators.includes('bias')
  // 仅保留一个副图显示：macd 或 kdj 或 none（成交量始终显示）
  const hasMACD = activeSubChart === 'macd' ? macdEnabled : false
  const hasKDJ = activeSubChart === 'kdj' ? kdjEnabled : false
  const hasBIAS = activeSubChart === 'bias' ? biasEnabled : false
  
  const maS = dayLineWithMetric.maS || []
  const maM = dayLineWithMetric.maM || []
  const maL = dayLineWithMetric.maL || []
  const maX = dayLineWithMetric.maX || []
  const dif = dayLineWithMetric.dif || []
  const dea = dayLineWithMetric.dea || []
  const bar = dayLineWithMetric.bar || []
  const kdjK = dayLineWithMetric.kdjK || []
  const kdjD = dayLineWithMetric.kdjD || []
  const kdjJ = dayLineWithMetric.kdjJ || []
  const biasS = dayLineWithMetric.biasS || []
  const biasM = dayLineWithMetric.biasM || []
  const biasL = dayLineWithMetric.biasL || []
  
  const trendPoints = processTrendPoints(data.trendData)
  const macdDeviations = processMacdDeviationPoints(dif, dea, dayLineWithMetric.line || [])
  const simulationPoints = Array.isArray(simulatedBuyPoints)
    ? simulatedBuyPoints
      .filter(point => Number.isFinite(point?.index) && Number.isFinite(point?.price))
      .map((point, index) => ({
        name: `sim-buy-${index + 1}`,
        coord: [point.index, point.price],
        value: 'B',
        symbol: 'circle',
        symbolSize: 9,
        itemStyle: { color: '#2563eb', borderColor: '#ffffff', borderWidth: 1 },
        label: { show: false }
      }))
    : []
  const trendSegments = buildTrendSegments(dayLineWithMetric.line || [], dif, data.categoryData || [])
  const bullTrendAreas = trendSegments
    .filter(segment => segment.state === 'bull')
    .map(segment => [{ xAxis: segment.startX }, { xAxis: segment.endX }])
  const bearTrendAreas = trendSegments
    .filter(segment => segment.state === 'bear')
    .map(segment => [{ xAxis: segment.startX }, { xAxis: segment.endX }])
  
  // 两个网格：主图 + 单一副图（成交量/MACD/KDJ 之一）
  const grid = [
    { left: '10%', right: '10%', top: '4%', height: '60%' },
    { left: '10%', right: '10%', top: '74%', height: '20%' }
  ]
  
  // 副图网格索引统一为 1
  const subGridIndex = 1
  
  // X轴（主图 + 单一副图）
  const xAxis = [
    {
      type: 'category',
      data: data.categoryData,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
      axisLabel: { 
        show: true,
        formatter: formatDateMMDD
      },
      axisPointer: {
        z: 100,
        label: {
          formatter: params => formatDateYYYYMMDD(params.value)
        }
      }
    },
    {
      type: 'category',
      gridIndex: subGridIndex,
      data: data.categoryData,
      boundaryGap: false,
      axisLine: { onZero: false },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { 
        show: true,
        formatter: formatDateMMDD
      },
      min: 'dataMin',
      max: 'dataMax',
      axisPointer: {
        label: {
          formatter: params => formatDateYYYYMMDD(params.value)
        }
      }
    }
  ]
  
  // Y轴（主图 + 单一副图）
  const yAxis = [
    {
      scale: true,
      splitArea: {
        show: false
      }
    },
    { scale: true, gridIndex: subGridIndex, splitNumber: 2, axisLabel: { show: true }, axisLine: { show: true }, axisTick: { show: true }, splitLine: { show: true } }
  ]
  
  // 如果有换手率，在副图中添加右侧百分比轴
  let turnoverYAxisIndex = null
  const turnoverFromLine = Array.isArray(dayLineWithMetric?.data) ? dayLineWithMetric.data.map(d => (d?.turn ?? d?.turnoverRate ?? d?.turnover ?? null)) : []
  const turnoverRate = dayLineWithMetric.turn || dayLineWithMetric.turnoverRate || dayLineWithMetric.turnover || turnoverFromLine
  const hasTurnover = Array.isArray(turnoverRate) && turnoverRate.some(v => v != null)
  if (activeSubChart === 'volume' && hasTurnover) {
    turnoverYAxisIndex = yAxis.length
    yAxis.push({
      scale: true,
      gridIndex: subGridIndex,
      position: 'right',
      axisLabel: { show: true, formatter: value => `${value}%` },
      axisLine: { show: true },
      axisTick: { show: true },
      splitLine: { show: false },
      min: 0
    })
  }
  
  // DataZoom 仅联动两个轴
  const zoomAxisIndex = [0, subGridIndex]
  const sliderTop = '90%'
  const visibleCount = 60
  const dataLength = Array.isArray(data?.categoryData) ? data.categoryData.length : 0
  const zoomStart = dataLength > visibleCount ? Math.max(0, ((dataLength - visibleCount) / dataLength) * 100) : 0
  
  // 系列
  const series = [
    ...(bullTrendAreas.length > 0 ? [{
      name: '多头趋势背景',
      type: 'line',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: data.categoryData.map(() => null),
      showSymbol: false,
      lineStyle: { opacity: 0 },
      tooltip: { show: false },
      silent: true,
      z: -10,
      markArea: {
        silent: true,
        itemStyle: { color: 'rgba(236, 0, 0, 0.08)' },
        data: bullTrendAreas
      }
    }] : []),
    ...(bearTrendAreas.length > 0 ? [{
      name: '空头趋势背景',
      type: 'line',
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: data.categoryData.map(() => null),
      showSymbol: false,
      lineStyle: { opacity: 0 },
      tooltip: { show: false },
      silent: true,
      z: -10,
      markArea: {
        silent: true,
        itemStyle: { color: 'rgba(0, 218, 60, 0.08)' },
        data: bearTrendAreas
      }
    }] : []),
    {
      name: 'K线',
      type: 'candlestick',
      data: data.values,
      itemStyle: {
        color: upColor,
        color0: downColor,
        borderColor: upColor,
        borderColor0: downColor
      },
      markPoint: {
        symbol: 'pin',
        symbolSize: 40,
        data: [...trendPoints, ...simulationPoints],
        label: {
          formatter: function(params) {
            return params.data.value
          },
          position: 'top',
          distance: 10,
          fontSize: 12,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: [4, 8],
          borderRadius: 4,
          color: '#fff'
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 15,
            shadowColor: '#fff'
          },
          scale: 1.2
        },
        silent: false,
        animation: true,
        animationDuration: 300
      }
    },
    // MA线系列 - 只有启用MA时才显示
    ...(enabledIndicators.includes('ma') ? [
      { name: 'maS', type: 'line', data: maS, smooth: true, lineStyle: { opacity: 0.5 }, showSymbol: false },
      { name: 'maM', type: 'line', data: maM, smooth: true, lineStyle: { opacity: 0.5 }, showSymbol: false },
      { name: 'maL', type: 'line', data: maL, smooth: true, lineStyle: { opacity: 0.5 }, showSymbol: false },
      { name: 'maX', type: 'line', data: maX, smooth: true, lineStyle: { opacity: 0.5 }, showSymbol: false }
    ] : []),
    // 单一副图：成交量/MACD/KDJ 之一
    ...(activeSubChart === 'volume' ? [
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: subGridIndex,
        yAxisIndex: subGridIndex,
        data: data.volumes,
        itemStyle: {
          color: params => params.data[2] > 0 ? upColor : downColor
        }
      }
    ] : []),
    // 如果有换手率，叠加换手率曲线（使用副图的右侧百分比轴）
    ...(activeSubChart === 'volume' && hasTurnover ? [
      { name: '换手率', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: turnoverYAxisIndex, data: turnoverRate, smooth: true, lineStyle: { color: '#f6ad55', width: 1 }, showSymbol: false }
    ] : []),
    ...(activeSubChart === 'macd' && macdEnabled ? [
      { name: 'DIF', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: dif, smooth: true, lineStyle: { color: '#da6ee8', width: 1 }, showSymbol: false },
      { name: 'DEA', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: dea, smooth: true, lineStyle: { color: '#39afe6', width: 1 }, showSymbol: false },
      { name: 'BAR', type: 'bar', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: bar, itemStyle: { color: params => params.data > 0 ? upColor : downColor } },
      { name: 'MACD底背离', type: 'scatter', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: macdDeviations.bottomPoints, symbol: 'triangle', symbolSize: 12, itemStyle: { color: '#22c55e' }, label: { show: true, formatter: '底背离', position: 'bottom', color: '#22c55e', fontSize: 10, backgroundColor: '#fff', borderColor: '#22c55e', borderWidth: 1, borderRadius: 2, padding: [1, 3] } },
      { name: 'MACD顶背离', type: 'scatter', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: macdDeviations.topPoints, symbol: 'triangle', symbolRotate: 180, symbolSize: 12, itemStyle: { color: '#ef4444' }, label: { show: true, formatter: '顶背离', position: 'top', color: '#ef4444', fontSize: 10, backgroundColor: '#fff', borderColor: '#ef4444', borderWidth: 1, borderRadius: 2, padding: [1, 3] } }
    ] : []),
    ...(activeSubChart === 'kdj' && kdjEnabled ? [
      { name: 'KDJ-K', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: kdjK, smooth: true, lineStyle: { color: '#ffd166', width: 1 }, showSymbol: false },
      { name: 'KDJ-D', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: kdjD, smooth: true, lineStyle: { color: '#06d6a0', width: 1 }, showSymbol: false },
      { name: 'KDJ-J', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: kdjJ, smooth: true, lineStyle: { color: '#ef476f', width: 1 }, showSymbol: false }
    ] : []),
    ...(activeSubChart === 'bias' && biasEnabled ? [
      { name: 'BIAS-S', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: biasS, smooth: true, lineStyle: { color: '#f59e0b', width: 1.2 }, showSymbol: false },
      { name: 'BIAS-M', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: biasM, smooth: true, lineStyle: { color: '#3b82f6', width: 1.1 }, showSymbol: false },
      { name: 'BIAS-L', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: biasL, smooth: true, lineStyle: { color: '#8b5cf6', width: 1.1 }, showSymbol: false },
      { name: 'BIAS-0', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: data.categoryData.map(() => 0), smooth: false, lineStyle: { color: '#9ca3af', type: 'dashed', width: 1 }, showSymbol: false, silent: true, tooltip: { show: false } }
    ] : [])
  ]
  
  return {
    animation: false,
    backgroundColor: '#ffffff',
    textStyle: { color: '#111827' },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        const klineParam = params.find(p => p.seriesType === 'candlestick' || p.seriesName === 'K线')
        const dateAxisVal = klineParam ? klineParam.axisValue : (params[0] ? params[0].axisValue : '')
        const date = formatDateYYYYMMDD(dateAxisVal)
        let res = date + '<br/>'
        
        // K线数据
        if (klineParam && Array.isArray(klineParam.data)) {
          res += `
            开盘: ${klineParam.data[1]}<br/>
            收盘: ${klineParam.data[2]}<br/>
            最低: ${klineParam.data[3]}<br/>
            最高: ${klineParam.data[4]}<br/>
          `
        }
        
        // 均线数据
        if (enabledIndicators.includes('ma')) {
          params.forEach((param, index) => {
            if (index > 0 && index < 5) { // MA线
              res += `${param.seriesName}: ${param.data !== '-' ? param.data : '-'}<br/>`
            }
          })
        }
        
        // MACD数据
        if (hasMACD) {
          const difParam = params.find(p => p.seriesName === 'DIF')
          const deaParam = params.find(p => p.seriesName === 'DEA')
          const barParam = params.find(p => p.seriesName === 'BAR')
          if (difParam && typeof difParam.data === 'number') {
            res += `DIF: ${difParam.data.toFixed(4)}<br/>`
          }
          if (deaParam && typeof deaParam.data === 'number') {
            res += `DEA: ${deaParam.data.toFixed(4)}<br/>`
          }
          if (barParam && typeof barParam.data === 'number') {
            res += `BAR: ${barParam.data.toFixed(4)}<br/>`
          }
          const bottomDevParam = params.find(p => p.seriesName === 'MACD底背离')
          const topDevParam = params.find(p => p.seriesName === 'MACD顶背离')
          if (bottomDevParam) {
            res += `MACD底背离<br/>`
          }
          if (topDevParam) {
            res += `MACD顶背离<br/>`
          }
        }
        
        // KDJ数据
        if (hasKDJ) {
          const kParam = params.find(p => p.seriesName === 'KDJ-K')
          const dParam = params.find(p => p.seriesName === 'KDJ-D')
          const jParam = params.find(p => p.seriesName === 'KDJ-J')
          if (kParam && typeof kParam.data === 'number') {
            res += `K: ${kParam.data.toFixed(2)}<br/>`
          }
          if (dParam && typeof dParam.data === 'number') {
            res += `D: ${dParam.data.toFixed(2)}<br/>`
          }
          if (jParam && typeof jParam.data === 'number') {
            res += `J: ${jParam.data.toFixed(2)}<br/>`
          }
        }
        if (hasBIAS) {
          const sParam = params.find(p => p.seriesName === 'BIAS-S')
          const mParam = params.find(p => p.seriesName === 'BIAS-M')
          const lParam = params.find(p => p.seriesName === 'BIAS-L')
          if (sParam && typeof sParam.data === 'number') {
            res += `BIAS-S: ${sParam.data.toFixed(2)}%<br/>`
          }
          if (mParam && typeof mParam.data === 'number') {
            res += `BIAS-M: ${mParam.data.toFixed(2)}%<br/>`
          }
          if (lParam && typeof lParam.data === 'number') {
            res += `BIAS-L: ${lParam.data.toFixed(2)}%<br/>`
          }
        }
        
        // 成交量
        const volumeParam = params.find(p => p.seriesName === '成交量')
        if (volumeParam && volumeParam.data) {
          res += `成交量: ${volumeParam.data[1]}<br/>`
        }
        
        // 换手率
        const turnoverParam = params.find(p => p.seriesName === '换手率')
        if (turnoverParam && typeof turnoverParam.data === 'number') {
          res += `换手率: ${turnoverParam.data.toFixed(2)}%<br/>`
        }
        
        return res
      }
    },
    axisPointer: {
      link: { xAxisIndex: 'all' },
      label: {
        backgroundColor: '#777'
      }
    },
    brush: {
      xAxisIndex: 'all',
      brushLink: 'all',
      outOfBrush: {
        colorAlpha: 0.1
      }
    },
    grid,
    xAxis,
    yAxis,
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: zoomAxisIndex,
        start: zoomStart,
        end: 100
      },
      {
        show: true,
        xAxisIndex: zoomAxisIndex,
        type: 'slider',
        top: sliderTop,
        start: zoomStart,
        end: 100
      }
    ],
    series
  }
}
