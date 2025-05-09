
<template>
  <div class="stock-detail">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'

const route = useRoute()
const chartContainer = ref(null)
let myChart = null

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
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: false
          },
          brush: {
            type: ['lineX', 'clear']
          }
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

  const handleResize = () => myChart?.resize()
  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    if (myChart) {
      myChart.dispose()
    }
    window.removeEventListener('resize', handleResize)
  })
})
</script>

<style scoped>
.stock-detail {
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
}

.chart-container {
  width: 100%;
  height: 100%;
}
</style>