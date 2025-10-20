/**
 * K线图相关工具函数
 */

// 颜色配置
export const upColor = '#00da3c'
export const downColor = '#ec0000'

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

/**
 * 创建图表选项
 * @param {Object} data - 图表数据
 * @param {Object} dayLineWithMetric - 包含所有指标的日线数据
 * @param {Function} formatDateYYYYMMDD - 日期格式化函数
 * @param {Function} formatDateMMDD - 日期格式化函数
 * @returns {Object} 图表选项
 */
export function createChartOption(data, dayLineWithMetric, formatDateYYYYMMDD, formatDateMMDD, enabledIndicators = ['ma', 'macd'], activeSubChart = 'volume') {
  const macdEnabled = enabledIndicators.includes('macd')
  const kdjEnabled = enabledIndicators.includes('kdj')
  // 仅保留一个副图显示：macd 或 kdj 或 none（成交量始终显示）
  const hasMACD = activeSubChart === 'macd' ? macdEnabled : false
  const hasKDJ = activeSubChart === 'kdj' ? kdjEnabled : false
  
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
  
  const trendPoints = processTrendPoints(data.trendData)
  
  // 两个网格：主图 + 单一副图（成交量/MACD/KDJ 之一）
  const grid = [
    { left: '10%', right: '10%', height: '65%' },
    { left: '10%', right: '10%', top: '72%', height: '22%' }
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
    { scale: true, splitArea: { show: true } },
    { scale: true, gridIndex: subGridIndex, splitNumber: 2, axisLabel: { show: true }, axisLine: { show: true }, axisTick: { show: true }, splitLine: { show: true } }
  ]
  
  // DataZoom 仅联动两个轴
  const zoomAxisIndex = [0, subGridIndex]
  const sliderTop = '90%'
  
  // 系列
  const series = [
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
        data: trendPoints,
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
    ...(activeSubChart === 'macd' && macdEnabled ? [
      { name: 'DIF', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: dif, smooth: true, lineStyle: { color: '#da6ee8', width: 1 }, showSymbol: false },
      { name: 'DEA', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: dea, smooth: true, lineStyle: { color: '#39afe6', width: 1 }, showSymbol: false },
      { name: 'BAR', type: 'bar', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: bar, itemStyle: { color: params => params.data > 0 ? upColor : downColor } }
    ] : []),
    ...(activeSubChart === 'kdj' && kdjEnabled ? [
      { name: 'KDJ-K', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: kdjK, smooth: true, lineStyle: { color: '#ffd166', width: 1 }, showSymbol: false },
      { name: 'KDJ-D', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: kdjD, smooth: true, lineStyle: { color: '#06d6a0', width: 1 }, showSymbol: false },
      { name: 'KDJ-J', type: 'line', xAxisIndex: subGridIndex, yAxisIndex: subGridIndex, data: kdjJ, smooth: true, lineStyle: { color: '#ef476f', width: 1 }, showSymbol: false }
    ] : [])
  ]
  
  return {
    animation: false,
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
            开盘: ${klineParam.data[0]}<br/>
            收盘: ${klineParam.data[1]}<br/>
            最低: ${klineParam.data[2]}<br/>
            最高: ${klineParam.data[3]}<br/>
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
        
        // 成交量
        const volumeParam = params.find(p => p.seriesName === '成交量')
        if (volumeParam && volumeParam.data) {
          res += `成交量: ${volumeParam.data[1]}<br/>`
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
        start: 50,
        end: 100
      },
      {
        show: true,
        xAxisIndex: zoomAxisIndex,
        type: 'slider',
        top: sliderTop,
        start: 50,
        end: 100
      }
    ],
    series
  }
}