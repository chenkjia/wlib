<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'

// 接收配置参数
const props = defineProps({
  // 图表数据
  data: {
    type: Array,
    default: () => []
  },
  // 图表配置选项
  options: {
    type: Object,
    default: () => ({})
  },
  // 主题
  theme: {
    type: String,
    default: ''
  }
})

// 图表相关引用和状态
const chartContainer = ref(null)
const chartInstance = ref(null)

// 颜色配置
const upColor = '#ec0000'
const upBorderColor = '#8A0000'
const downColor = '#00da3c'
const downBorderColor = '#008F28'


// 处理数据格式
function processData(data) {
  if (!data || !data.length) return []
  
  // 检查数据格式，如果已经是标准格式则直接返回
  if (data[0] instanceof Array) return data
  
  // 转换对象格式为数组格式
  return data.map((item, index, arr) => {
    // 支持多种属性名格式
    const time = item.time || item.date || item.timestamp || ''
    const open = item.open || 0
    const close = item.close || 0
    const low = item.low || item.lowest || 0
    const high = item.high || item.highest || 0
    const volume = item.volume || item.volumn || 0
    
    // 计算涨跌标记
    let sign
    if (open > close) {
      sign = -1 // 下跌
    } else if (open < close) {
      sign = 1  // 上涨
    } else {
      // 如果开盘=收盘，则根据前一天收盘价判断
      sign = index > 0
        ? arr[index - 1].close <= close ? 1 : -1
        : 1 // 没有前一天数据，默认为上涨
    }
    
    return [time, open, high, low, close, volume, sign]
  })
}

/**
 * 计算MA数据
 * @param {Number} dayCount - 天数
 * @param {Array} data - 数据
 * @returns {Array} MA数据
 */
function calculateMA(dayCount, data) {
  const result = []
  for (let i = 0, len = data.length; i < len; i++) {
    if (i < dayCount) {
      result.push('-')
      continue
    }
    let sum = 0
    for (let j = 0; j < dayCount; j++) {
      sum += data[i - j][4] // 收盘价
    }
    result.push(+(sum / dayCount).toFixed(2))
  }
  return result
}

/**
 * 格式化日期 YYYY-MM-DD
 */
function formatDateYYYYMMDD(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

/**
 * 格式化日期 MM-DD
 */
function formatDateMMDD(value) {
  const date = new Date(value)
  return `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 渲染K线图
async function renderChart() {
  // 确保容器存在且有数据
  if (!chartContainer.value || !props.data || !props.data.length) return
  
  // 检查容器尺寸
  const containerRect = chartContainer.value.getBoundingClientRect()
  const containerWidth = containerRect.width
  const containerHeight = containerRect.height
  
  if (containerWidth <= 0 || containerHeight <= 0) {
    // 容器尺寸无效，延迟重试
    setTimeout(renderChart, 200)
    return
  }
  
  // 清理旧的图表实例
  if (chartInstance.value) {
    chartInstance.value.dispose()
  }
  
  // 创建新的图表实例
  chartInstance.value = echarts.init(chartContainer.value, props.theme)
  
  // 处理数据
  const processedData = processData(props.data)
  const dataCount = processedData.length
  
  // 提取收盘价用于计算均线
  const values = processedData.map(item => [
    item[1], // 开盘
    item[4], // 收盘
    item[3], // 最低
    item[2]  // 最高
  ])
  
  // 计算均线数据
  const ma7 = calculateMA(7, processedData)
  const ma30 = calculateMA(30, processedData)
  const ma60 = calculateMA(60, processedData)
  
  // 准备K线图的配置
  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      formatter: (params) => {
        // 格式化日期为年月日
        const date = formatDateYYYYMMDD(params[0].axisValue)
        let res = `日期: ${date}<br/>`
        
        // K线数据
        if (params[0]) {
          const kData = params[0].data
          res += `
            开盘: ${kData[1]}<br/>
            收盘: ${kData[4]}<br/>
            最低: ${kData[3]}<br/>
            最高: ${kData[2]}<br/>
          `
        }
        
        // 均线数据
        params.forEach((param, index) => {
          if (index > 0 && index < 4) { // MA线
            res += `${param.seriesName}: ${param.data !== '-' ? param.data : '-'}<br/>`
          }
        })
        
        // 成交量
        const volumeParam = params.find(p => p.seriesName === '成交量')
        if (volumeParam) {
          res += `成交量: ${volumeParam.data[1].toLocaleString()}<br/>`
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
    toolbox: {
      feature: {
        dataZoom: {
          yAxisIndex: false
        },
        restore: {},
        saveAsImage: {}
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
        data: processedData.map(item => item[0]),
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax',
        axisLabel: { 
          show: true,
          formatter: value => formatDateYYYYMMDD(value)
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
        data: processedData.map(item => item[0]),
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { 
          show: true,
          formatter: value => formatDateYYYYMMDD(value)
        },
        min: 'dataMin',
        max: 'dataMax'
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
    visualMap: {
      show: false,
      seriesIndex: 4,
      dimension: 2,
      pieces: [
        {
          value: 1,
          color: upColor
        },
        {
          value: -1,
          color: downColor
        }
      ]
    },
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: values,
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: upBorderColor,
          borderColor0: downBorderColor
        }
      },
      {
        name: 'MA7',
        type: 'line',
        data: ma7,
        smooth: true,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: 'MA30',
        type: 'line',
        data: ma30,
        smooth: true,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: 'MA60',
        type: 'line',
        data: ma60,
        smooth: true,
        lineStyle: { opacity: 0.5 }
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: processedData.map((item, index) => [index, item[5], item[6]]),
        itemStyle: {
          color: params => params.data[2] > 0 ? upColor : downColor
        }
      }
    ]
  }
  
  // 合并用户自定义选项
  const mergedOption = {
    ...option,
    ...props.options,
    // 确保关键配置不被完全覆盖
    series: props.options.series || option.series
  }
  
  // 设置图表选项
  chartInstance.value.setOption(mergedOption)
}
// 暴露给父组件的方法 - 调整图表大小
const resize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

// 暴露给父组件的方法 - 销毁图表
const dispose = () => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
}

// 向父组件暴露方法
defineExpose({
  resize,
  dispose
})

// 组件挂载时初始化
onMounted(async () => {
  await nextTick()
  window.addEventListener('resize', resize)
  
  // 给DOM足够的时间挂载
  setTimeout(() => {
    renderChart()
  }, 300)
})

// 监听数据变化重新渲染
watch(() => [props.data, props.options, props.theme], () => {
  renderChart()
}, { deep: true })

// 组件卸载时清理资源
onUnmounted(() => {
  window.removeEventListener('resize', resize)
  dispose()
})

// 模拟数据生成函数（仅供测试使用）
function generateOHLC(count) {
  let data = []
  let xValue = +new Date(2011, 0, 1)
  let minute = 60 * 1000
  let baseValue = Math.random() * 12000
  let boxVals = new Array(4)
  let dayRange = 12
  
  for (let i = 0; i < count; i++) {
    baseValue = baseValue + Math.random() * 20 - 10
    for (let j = 0; j < 4; j++) {
      boxVals[j] = (Math.random() - 0.5) * dayRange + baseValue
    }
    boxVals.sort()
    
    let openIdx = Math.round(Math.random() * 3)
    let closeIdx = Math.round(Math.random() * 2)
    if (closeIdx === openIdx) {
      closeIdx++
    }
    
    let volumn = boxVals[3] * (1000 + Math.random() * 500)
    
    // ['time', 'open', 'highest', 'lowest', 'close', 'volumn', 'sign']
    data[i] = [
      echarts.format.formatTime('yyyy-MM-dd', (xValue += minute)), // 只显示日期
      +boxVals[openIdx].toFixed(2),
      +boxVals[3].toFixed(2),
      +boxVals[0].toFixed(2),
      +boxVals[closeIdx].toFixed(2),
      +volumn.toFixed(0),
      getSign(data, i, +boxVals[openIdx], +boxVals[closeIdx], 4) // sign
    ]
  }
  
  return data
  
  function getSign(data, dataIndex, openVal, closeVal, closeDimIdx) {
    let sign
    if (openVal > closeVal) {
      sign = -1
    } else if (openVal < closeVal) {
      sign = 1
    } else {
      sign = dataIndex > 0
        ? data[dataIndex - 1][closeDimIdx] <= closeVal ? 1 : -1
        : 1
    }
    return sign
  }
}
</script>

<template>
  <div class="chart-wrapper">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  flex: 1;
}
</style>