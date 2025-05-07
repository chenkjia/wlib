<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'

const route = useRoute()
const stockData = ref(null)
const chartRef = ref(null)

async function fetchStockData() {
  try {
    const response = await fetch(`/api/stocks/${route.params.code}`)
    const data = await response.json()
    stockData.value = data
    initChart()
  } catch (error) {
    console.error('获取股票数据失败:', error)
  }
}

function initChart() {
  if (!chartRef.value || !stockData.value?.dayLine) return

  const chart = echarts.init(chartRef.value)
  const data = stockData.value.dayLine.map(item => ([
    item.date,
    item.open,
    item.close,
    item.low,
    item.high,
    item.volume
  ]))

  const option = {
    title: {
      text: `${stockData.value.name} (${stockData.value.code})`,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['K线', '成交量'],
      bottom: 10
    },
    grid: [
      {
        left: '10%',
        right: '10%',
        height: '60%'
      },
      {
        left: '10%',
        right: '10%',
        top: '75%',
        height: '15%'
      }
    ],
    xAxis: [
      {
        type: 'category',
        data: data.map(item => item[0]),
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        splitNumber: 20
      },
      {
        type: 'category',
        gridIndex: 1,
        data: data.map(item => item[0]),
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        splitNumber: 20
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
        bottom: '5%',
        start: 50,
        end: 100
      }
    ],
    series: [
      {
        name: 'K线',
        type: 'candlestick',
        data: data.map(item => item.slice(1, 5)),
        itemStyle: {
          color: '#ef5350',
          color0: '#26a69a',
          borderColor: '#ef5350',
          borderColor0: '#26a69a'
        }
      },
      {
        name: '成交量',
        type: 'bar',
        xAxisIndex: 1,
        yAxisIndex: 1,
        data: data.map(item => item[5])
      }
    ]
  }

  chart.setOption(option)

  window.addEventListener('resize', () => {
    chart.resize()
  })
}

onMounted(() => {
  fetchStockData()
})
</script>

<template>
  <div class="p-4">
    <div v-if="stockData" class="space-y-4">
      <UCard>
        <div class="flex items-center justify-between">
          <h1 class="text-2xl font-bold">{{ stockData.name }} ({{ stockData.code }})</h1>
          <div class="text-lg">
            <span class="font-semibold">最新价：</span>
            <span :class="{
              'text-red-500': stockData.dayLine?.[0]?.change > 0,
              'text-green-500': stockData.dayLine?.[0]?.change < 0
            }">
              {{ stockData.dayLine?.[0]?.close || '-' }}
            </span>
          </div>
        </div>
      </UCard>
      
      <UCard>
        <div ref="chartRef" class="w-full h-[600px]"></div>
      </UCard>
    </div>
    
    <div v-else class="flex justify-center items-center h-[400px]">
      <USkeleton class="w-full" />
    </div>
  </div>
</template>

<style scoped>
</style>