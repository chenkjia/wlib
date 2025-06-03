<template>
  <div class="signal-detail">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  signal: {
    type: Object,
    required: true
  }
})

const chartContainer = ref(null)
const hourLine = ref([])
let myChart = null

function splitData(rawData) {
  // 返回 [日期, open, close, low, high, volumn] 结构
  return rawData.map(item => [
    item.time,
    item.open,
    item.close,
    item.low,
    item.high,
    item.volume
  ])
}

async function fetchHourLine(signal) {
  if (!signal) return
  const signalDate = new Date(signal.signalTime)
  const startTime = new Date(signalDate.getTime() - 100 * 24 * 60 * 60 * 1000)
  const endTime = new Date(signalDate.getTime() + 200 * 24 * 60 * 60 * 1000)
  const res = await fetch(`/api/hourLine?code=${signal.stockCode}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`)
  hourLine.value = await res.json()
  renderChart()
}

function renderChart() {
  if (!chartContainer.value) return
  if (!myChart) {
    myChart = echarts.init(chartContainer.value, 'light')
  }
  const data = splitData(hourLine.value)
  // 定位signalTime索引
  let signalIndex = 0
  let signalPrice = props.signal.signalPrice
  if (props.signal.signalTime) {
    signalIndex = data.findIndex(d => {
      // 精确到小时
      return d[0] && new Date(d[0]).getTime() === new Date(props.signal.signalTime).setMinutes(0,0,0)
    })
    if (signalIndex === -1) signalIndex = 0
  }
  // 计算初始缩放区间（以signalIndex为中心）
  let start = 0, end = 100
  if (data.length > 0) {
    const percent = data.length > 0 ? (signalIndex / data.length) * 100 : 0
    start = Math.max(0, percent - 10)
    end = Math.min(100, percent + 10)
  }
  myChart.setOption({
    animation: false,
    dataset: [{ source: data }],
    grid: [
      { left: 60, right: 20, top: 20, bottom: 120 },
      { left: 60, right: 20, height: 80, bottom: 40 }
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function (params) {
        const d = params[0].data;
        const t = d[0]
        const date = new Date(t)
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const h = String(date.getHours()).padStart(2, '0')
        return [
          '时间: ' + `${y}-${m}-${day} ${h}:00`,
          '开盘: ' + d[1],
          '收盘: ' + d[2],
          '最低: ' + d[3],
          '最高: ' + d[4],
          '成交量: ' + d[5]
        ].join('<br/>');
      }
    },
    xAxis: [
      {
        type: 'category',
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax',
        axisLabel: {
          formatter: function (value) {
            if (!value) return ''
            const d = new Date(value)
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            const h = String(d.getHours()).padStart(2, '0')
            return `${y}-${m}-${day} ${h}`
          }
        },
        gridIndex: 0
      },
      {
        type: 'category',
        gridIndex: 1,
        scale: true,
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
        splitArea: { show: true },
        gridIndex: 0
      },
      {
        scale: true,
        gridIndex: 1,
        position: 'right',
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
        start: start,
        end: end
      },
      {
        show: true,
        xAxisIndex: [0, 1],
        type: 'slider',
        top: '90%',
        start: start,
        end: end
      }
    ],
    series: [
      {
        type: 'candlestick',
        name: '小时线',
        encode: { x: 0, y: [1, 2, 3, 4] },
        large: true,
        progressive: 5000,
        itemStyle: {
          color: '#00da3c',
          color0: '#ec0000',
          borderColor: '#00da3c',
          borderColor0: '#ec0000'
        },
        xAxisIndex: 0,
        yAxisIndex: 0,
        markLine: {
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#f00', width: 2 },
          data: [
            signalIndex > 0 ? { xAxis: signalIndex } : null,
            signalPrice ? { yAxis: signalPrice } : null
          ].filter(Boolean)
        }
      },
      {
        type: 'bar',
        name: '成交量',
        encode: { x: 0, y: 5 },
        xAxisIndex: 1,
        yAxisIndex: 1,
        itemStyle: {
          color: 'rgba(60,120,216,0.3)'
        }
      }
    ]
  })
}

watch(() => props.signal, (newSignal) => {
  fetchHourLine(newSignal)
}, { immediate: true })

onMounted(() => {
  if (chartContainer.value) {
    myChart = echarts.init(chartContainer.value, 'light')
  }
})

onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
  }
})
</script>

<style scoped>
.chart-container {
  width: 100%;
  height: 100%;
  z-index: 10;
}
</style>