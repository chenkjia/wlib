
<template>
  <div class="stock-detail">
    <div class="chart-wrapper relative">
      <button @click="toggleFullScreen" class="absolute top-2 right-2 z-20 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded text-sm">
        {{ isFullScreen ? '退出全屏' : '全屏显示' }}
      </button>
      <div ref="chartContainer" class="chart-container"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'

const route = useRoute()
const chartContainer = ref(null)
const isFullScreen = ref(false)
let myChart = null

// 切换全屏显示
function toggleFullScreen() {
  isFullScreen.value = !isFullScreen.value
  
  const chartWrapper = document.querySelector('.chart-wrapper')
  if (isFullScreen.value) {
    // 进入全屏模式
    chartWrapper.classList.add('fullscreen-mode')
    document.body.style.overflow = 'hidden'
  } else {
    // 退出全屏模式
    chartWrapper.classList.remove('fullscreen-mode')
    document.body.style.overflow = ''
  }
  
  // 调整图表大小
  setTimeout(() => {
    if (myChart) {
      myChart.resize()
    }
  }, 100)
}

// 颜色配置
const upColor = '#00da3c'
const downColor = '#ec0000'

// 计算MA数据
function calculateMA(dayCount, data) {
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
    result.push((sum / dayCount).toFixed(3))
  }
  return result
}

// 格式化数据
function splitData(rawData) {
  const categoryData = []
  const values = []
  const volumes = []

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i]
    categoryData.push(item.date)
    values.push([item.open, item.close, item.low, item.high])
    volumes.push([i, item.volume, item.open > item.close ? 1 : -1])
  }

  return {
    categoryData,
    values,
    volumes
  }
}

// 初始化图表
async function initChart() {
  try {
    const response = await fetch(`/api/dayLine?code=${route.params.code}`)
    const rawData = await response.json()
    const data = splitData(rawData)

    // 计算MA数据
    const ma7 = calculateMA(7, data.values)
    const ma50 = calculateMA(50, data.values)
    const ma100 = calculateMA(100, data.values)

    // 配置项
    const option = {
      animation: false,
      legend: {
        top: 10,
        left: 'center',
        data: ['K线', 'MA7', 'MA50', 'MA100']
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        textStyle: {
          color: '#000'
        },
        position: function (pos, params, el, elRect, size) {
          const obj = {
            top: 10
          }
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30
          return obj
        }
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
        label: {
          backgroundColor: '#777'
        }
      },
      // 移除了工具箱配置

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
          right: '8%',
          height: '50%'
        },
        {
          left: '10%',
          right: '8%',
          top: '65%',
          height: '25%'
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
          axisPointer: {
            z: 100
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
          axisLabel: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        }
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true
          }
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
          }
        },
        {
          name: 'MA7',
          type: 'line',
          data: ma7,
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        {
          name: 'MA50',
          type: 'line',
          data: ma50,
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        {
          name: 'MA100',
          type: 'line',
          data: ma100,
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: data.volumes,
          itemStyle: {
            color: function (params) {
              return params.data[2] > 0 ? upColor : downColor
            }
          }
        }
      ]
    }

    myChart.setOption(option)
  } catch (error) {
    console.error('初始化图表失败:', error)
  }
}

onMounted(async () => {
  myChart = echarts.init(chartContainer.value, 'dark')
  await initChart()

  window.addEventListener('resize', handleResize)
})

const handleResize = () => {
  if (myChart) {
    myChart.resize()
  }
}

onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.stock-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  z-index: 10;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.top-2 {
  top: 0.5rem;
}

.right-2 {
  right: 0.5rem;
}

.z-20 {
  z-index: 20;
}

/* 全屏模式样式 */
.fullscreen-mode {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: white;
  z-index: 1000;
  padding: 10px;
}

.fullscreen-mode .chart-container {
  height: calc(100vh - 20px);
}
</style>