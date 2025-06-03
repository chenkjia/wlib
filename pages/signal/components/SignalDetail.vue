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
  // 返回 [日期, open, close, low, high] 结构，适配大数据K线
  return rawData.map(item => [
    item.time,
    item.open,
    item.close,
    item.low,
    item.high
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
  myChart.setOption({
    animation: false,
    dataset: [{ source: data }],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function (params) {
        const d = params[0].data;
        return [
          '时间: ' + d[0],
          '开盘: ' + d[1],
          '收盘: ' + d[2],
          '最低: ' + d[3],
          '最高: ' + d[4]
        ].join('<br/>');
      }
    },
    xAxis: {
      type: 'category',
      scale: true,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false },
      min: 'dataMin',
      max: 'dataMax',
      axisLabel: {
        formatter: function (value) {
          return value ? value.split('T')[0] + ' ' + (value.split('T')[1] || '').slice(0,5) : ''
        }
      }
    },
    yAxis: {
      scale: true,
      splitArea: { show: true }
    },
    dataZoom: [
      {
        type: 'inside',
        xAxisIndex: [0],
        start: 80,
        end: 100
      },
      {
        show: true,
        xAxisIndex: [0],
        type: 'slider',
        top: '90%',
        start: 80,
        end: 100
      }
    ],
    series: [{
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
      }
    }]
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