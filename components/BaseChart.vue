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
  // MA数据
  maData: {
    type: Object,
    default: () => ({})
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
const isFullscreen = ref(false)
const resizeObserver = ref(null)

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

// MA计算逻辑已移至外部组件

/**
 * 格式化日期 YYYY-MM-DD
 */
function formatDateYYYYMMDD(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
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
  
  // 验证处理后的数据结构
  if (!processedData.every(item => Array.isArray(item) && item.length >= 7 && 
      item.slice(1, 6).every(val => typeof val === 'number' && !isNaN(val)))) {
    console.warn('Invalid data structure detected, skipping render')
    return
  }
  
  // 提取收盘价用于计算均线
  const values = processedData.map(item => [
    item[1], // 开盘
    item[4], // 收盘
    item[3], // 最低
    item[2]  // 最高
  ])
  
  
  // 准备K线图的配置
  const option = {
    animation: false,
    tooltip: {
      trigger: 'axis'
    },
    axisPointer: {
      link: { xAxisIndex: 'all' },
      label: {
        backgroundColor: '#777'
      },
      triggerTooltip: true
    },
    // 移除工具栏和矩形选择功能
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
        type: 'inside'
      },
      {
        type: 'slider'
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
        name: 'maS',
        type: 'line',
        data: (props.maData && props.maData.maS) || [],
        smooth: true,
        lineStyle: { opacity: 0.5 },
        showSymbol: false
      },
      {
        name: 'maM',
        type: 'line',
        data: (props.maData && props.maData.maM) || [],
        smooth: true,
        lineStyle: { opacity: 0.5 },
        showSymbol: false
      },
      {
        name: 'maL',
        type: 'line',
        data: (props.maData && props.maData.maL) || [],
        smooth: true,
        lineStyle: { opacity: 0.5 },
        showSymbol: false
      },
      {
        name: 'maX',
        type: 'line',
        data: (props.maData && props.maData.maX) || [],
        smooth: true,
        lineStyle: { opacity: 0.5 },
        showSymbol: false
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
  
  // 验证数据完整性
  const isDataValid = values.length > 0
  if (!isDataValid) {
    console.warn('Chart data is incomplete, skipping render')
    return
  }
  
  // 过滤掉无效的series
  const validSeries = option.series.filter(series => {
    if (!series || !series.type || !series.name) {
      console.warn('Invalid series found:', series)
      return false
    }
    // K线图必须保留，其他series需要有数据
    return series.name === 'K线' || (series.data && Array.isArray(series.data))
  })
  
  // 合并用户自定义选项
  const mergedOption = {
    ...option,
    ...props.options,
    // 确保关键配置不被完全覆盖
    series: props.options.series || validSeries,
    tooltip: {
      ...option.tooltip,
      ...(props.options.tooltip || {})
    }
  }
  
  // 调试信息
  console.log('Valid series count:', validSeries.length)
  console.log('Chart data length:', processedData.length)
  console.log('MA data:', props.maData)
  
  try {
    console.log('Setting chart option with series:', mergedOption.series.map(s => ({ name: s.name, type: s.type, dataLength: s.data?.length })))
    // 设置图表选项
    chartInstance.value.setOption(mergedOption, true)
  } catch (error) {
    console.error('图表渲染失败:', error)
    console.error('Failed option:', mergedOption)
    // 如果设置选项失败，清理图表实例
    if (chartInstance.value) {
      chartInstance.value.dispose()
      chartInstance.value = null
    }
  }
}
// 全屏切换功能
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  setTimeout(() => {
    resize()
  }, 100)
}

// 暴露给父组件的方法 - 调整图表大小
const resize = () => {
  if (chartInstance.value && props.data && props.data.length > 0) {
    try {
      chartInstance.value.resize()
    } catch (error) {
      console.warn('Chart resize failed:', error)
      // 如果resize失败，尝试重新渲染图表
      renderChart()
    }
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
  dispose,
  toggleFullscreen
})

// 组件挂载时初始化
onMounted(async () => {
  await nextTick()
  window.addEventListener('resize', resize)
  
  // 创建 ResizeObserver 监控容器尺寸变化
  if (chartContainer.value) {
    resizeObserver.value = new ResizeObserver(() => {
      if (chartInstance.value) {
        resize()
      }
    })
    resizeObserver.value.observe(chartContainer.value)
  }
  
  // 给DOM足够的时间挂载
  setTimeout(() => {
    renderChart()
  }, 300)
})

// 监听数据变化重新渲染
watch(() => [props.data, props.maData, props.options, props.theme], () => {
  renderChart()
}, { deep: true })

// 组件卸载时清理资源
onUnmounted(() => {
  window.removeEventListener('resize', resize)
  
  // 清理 ResizeObserver
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
    resizeObserver.value = null
  }
  
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
  <div class="chart-wrapper" :class="{ 'fullscreen': isFullscreen }">
    <div class="chart-header">
      <button class="fullscreen-btn" @click="toggleFullscreen">
        <svg class="fullscreen-icon" viewBox="0 0 24 24">
          <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
        </svg>
      </button>
    </div>
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

.chart-wrapper.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: white;
}

.chart-header {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.fullscreen-btn {
  padding: 8px;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  cursor: pointer;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.fullscreen-btn:hover {
  background: white;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.fullscreen-icon {
  width: 16px;
  height: 16px;
  fill: #666;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
  flex: 1;
}
</style>