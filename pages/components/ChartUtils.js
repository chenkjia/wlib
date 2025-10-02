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
 * @param {Array} maS - 短期移动平均线数据
 * @param {Array} maM - 中期移动平均线数据
 * @param {Array} maL - 长期移动平均线数据
 * @param {Array} maX - 超长期移动平均线数据
 * @param {Function} formatDateYYYYMMDD - 日期格式化函数
 * @param {Function} formatDateMMDD - 日期格式化函数
 * @returns {Object} 图表选项
 */
export function createChartOption(data, {maS, maM, maL, maX}, formatDateYYYYMMDD, formatDateMMDD) {
  const trendPoints = processTrendPoints(data.trendData)
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
        const volumeParam = params.find(p => p.seriesName === '成交量');
        if (volumeParam && volumeParam.data) {
          res += `成交量: ${volumeParam.data[1]}<br/>`;
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
          data: trendPoints,
          label: {
            formatter: function(params) {
              return params.data.value;
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
        lineStyle: { opacity: 0.5 },
        showSymbol: false
      },
      {
        name: 'maM',
        type: 'line',
        data: maM,
        smooth: true,
        lineStyle: { opacity: 0.5 },
        showSymbol: false
      },
      {
        name: 'maL',
        type: 'line',
        data: maL,
        smooth: true,
        lineStyle: { opacity: 0.5 },
        showSymbol: false
      },
      {
        name: 'maX',
        type: 'line',
        data: maX,
        smooth: true,
        lineStyle: { opacity: 0.5 },
        showSymbol: false
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