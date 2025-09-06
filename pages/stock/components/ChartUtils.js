/**
 * K线图相关工具函数
 */

// 颜色配置
export const upColor = '#00da3c'
export const downColor = '#ec0000'

/**
 * 计算MA数据
 * @param {Number} dayCount - 天数
 * @param {Array} data - 数据
 * @returns {Array} MA数据
 */
export function calculateMA(dayCount, data) {
  const result = []
  for (let i = 0, len = data.length; i < len; i++) {
    if (i < dayCount) {
      result.push('-')
      continue
    }
    let sum = 0
    for (let j = 0; j < dayCount; j++) {
      sum += data[i - j][1]
    }
    result.push(+(sum / dayCount).toFixed(2))
  }
  return result
}

/**
 * 分割K线图数据
 * @param {Array} rawData - 原始数据
 * @returns {Object} 分割后的数据
 */
export function splitData(rawData = []) {
  const categoryData = []
  const values = []
  const volumes = []
  const trendStartPoints = []
  const trendEndPoints = []
  
  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i]
    categoryData.push(item.time)
    values.push([item.open, item.close, item.low, item.high])
    volumes.push([i, item.volume, item.close > item.open ? 1 : -1])
  }
  
  return {
    categoryData,
    values,
    volumes,
    trendStartPoints,
    trendEndPoints
  }
}

/**
 * 处理趋势点标记
 * @param {Array} rawData - 原始数据
 * @param {Array} goals - 目标数据
 * @param {Object} data - 分割后的数据
 * @returns {Object} 处理后的数据
 */
export function processTrendPoints(rawData, goals, data) {
  const trendStartPoints = []
  const trendEndPoints = []
  
  // 遍历所有目标，添加趋势起点和终点标记
  goals.forEach((goal, goalIndex) => {
    let startPointAdded = false;
    let endPointAdded = false;
    
    for (let i = 0; i < rawData.length; i++) {
      const item = rawData[i]
      
      // 添加趋势起始点
      if (item.time === goal.startTime) {
        startPointAdded = true;
        trendStartPoints.push({
          coord: [i, item.low],
          value: item.slopeTrendStart ? '斜率趋势开始' : '趋势开始',
          goalIndex: goalIndex,
          itemStyle: { color: '#1E90FF' }
        })
      }
      
      // 添加趋势结束点
      if (item.time === goal.endTime) {
        endPointAdded = true;
        trendEndPoints.push({
          coord: [i, item.high],
          value: item.slopeTrendEnd ? '斜率趋势结束' : '趋势结束',
          goalIndex: goalIndex,
          itemStyle: { color: '#FF4500' }
        })
      }
    }
    
    // 如果没有找到对应的点，尝试找最接近的时间点
    if (!startPointAdded && goal.startTime) {
      const goalStartTime = new Date(goal.startTime).getTime();
      let closestIndex = 0;
      let minDiff = Infinity;
      
      for (let i = 0; i < rawData.length; i++) {
        const itemTime = new Date(rawData[i].time).getTime();
        const diff = Math.abs(itemTime - goalStartTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
      
      if (closestIndex >= 0 && closestIndex < rawData.length) {
        trendStartPoints.push({
          coord: [closestIndex, rawData[closestIndex].low],
          value: '趋势开始',
          goalIndex: goalIndex,
          itemStyle: { color: '#1E90FF' }
        });
      }
    }
    
    // 同样为结束点添加近似匹配
    if (!endPointAdded && goal.endTime) {
      const goalEndTime = new Date(goal.endTime).getTime();
      let closestIndex = 0;
      let minDiff = Infinity;
      
      for (let i = 0; i < rawData.length; i++) {
        const itemTime = new Date(rawData[i].time).getTime();
        const diff = Math.abs(itemTime - goalEndTime);
        if (diff < minDiff) {
          minDiff = diff;
          closestIndex = i;
        }
      }
      
      if (closestIndex >= 0 && closestIndex < rawData.length) {
        trendEndPoints.push({
          coord: [closestIndex, rawData[closestIndex].high],
          value: '趋势结束',
          goalIndex: goalIndex,
          itemStyle: { color: '#FF4500' }
        });
      }
    }
  })
  
  return {
    ...data,
    trendStartPoints,
    trendEndPoints
  }
}

/**
 * 创建图表选项
 * @param {Object} data - 图表数据
 * @param {Array} maS - 短期移动平均线数据
 * @param {Array} maM - 中期移动平均线数据
 * @param {Array} maL - 长期移动平均线数据
 * @param {Array} maX - 超长期移动平均线数据
 * @param {Function} formatDateYYYYMMDD - 日期格式化函数
 * @param {Function} formatDateMMDD - 日期格式化函数
 * @returns {Object} 图表选项
 */
export function createChartOption(data, maS, maM, maL, maX, formatDateYYYYMMDD, formatDateMMDD) {
  return {
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: function(params) {
        const date = formatDateYYYYMMDD(params[0].axisValue);
        let res = date + '<br/>';
        
        // K线数据
        if (params[0]) {
          res += `
            开盘: ${params[0].data[0]}<br/>
            收盘: ${params[0].data[1]}<br/>
            最低: ${params[0].data[2]}<br/>
            最高: ${params[0].data[3]}<br/>
          `;
        }
        
        // 均线数据
        params.forEach((param, index) => {
          if (index > 0 && index < 5) { // MA线
            res += `${param.seriesName}: ${param.data !== '-' ? param.data : '-'}<br/>`;
          }
        });
        
        // 成交量
        if (params[4]) {
          res += `成交量: ${params[4].data[1]}<br/>`;
        }
        
        return res;
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
    grid: [
      {
        left: '10%',
        right: '10%',
        height: '50%'
      },
      {
        left: '10%',
        right: '10%',
        top: '65%',
        height: '15%'
      }
    ],
    xAxis: [
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
        gridIndex: 1,
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
    ],
    yAxis: [
      {
        scale: true,
        splitArea: { show: true }
      },
      {
        scale: true,
        gridIndex: 1,
        splitNumber: 2,
        axisLabel: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        splitLine: { show: false }
      }
    ],
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0, 1],
        start: 50,
        end: 100
      },
      {
        show: true,
        xAxisIndex: [0, 1],
        type: 'slider',
        top: '85%',
        start: 50,
        end: 100
      }
    ],
    series: [
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
          data: [...data.trendStartPoints, ...data.trendEndPoints],
          label: {
            formatter: function(params) {
              const index = params.data.coord[0];
              const close = data.values[index][1];
              return params.data.value + '\n' + close.toFixed(2);
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
      {
        name: 'maS',
        type: 'line',
        data: maS,
        smooth: true,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: 'maM',
        type: 'line',
        data: maM,
        smooth: true,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: 'maL',
        type: 'line',
        data: maL,
        smooth: true,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: 'maX',
        type: 'line',
        data: maX,
        smooth: true,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: data.volumes,
        itemStyle: {
          color: params => params.data[2] > 0 ? upColor : downColor
        }
      }
    ]
  }
}