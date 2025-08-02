<script setup>
import { ref, watch } from 'vue'
import BaseChart from '../../../components/BaseChart.vue'

// 接收父组件传递的目标数据
const props = defineProps({
  goal: {
    type: Object,
    required: true
  }
})

// 引用BaseChart组件
const chartRef = ref(null)

// 图表数据
const chartData = ref(null)

// 监听goal变化，处理图表数据
watch(() => props.goal, async (newGoal) => {
  console.log(newGoal)
  chartData.value = await fetchDayLine(newGoal)
  // if (newGoal && newGoal.dayLine && Array.isArray(newGoal.dayLine)) {
  //   // 使用processChartData处理数据
  //   chartData.value = await fetchDayLine(newGoal)
  // } else {
  //   chartData.value = null
  // }
}, { immediate: true })


async function fetchDayLine(goal) {
  if (!goal) return
  const goalDate = new Date(goal.startTime)
  const startTime = new Date(goalDate.getTime() - 365 * 24 * 60 * 60 * 1000)
  const endTime = new Date(goalDate.getTime() + 365 * 24 * 60 * 60 * 1000)
  const res = await fetch(`/api/dayLine?code=${goal.stockCode}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`)
  hourLine.value = await res.json()
  hourMetric.value = calculateHourMetric(hourLine.value, {})
  renderChart()
}

// 图表标题
const chartTitle = '日线图示例'

// 引入图表工具函数
import { getSmallerOrderValue, calculateMA } from '../../../utils/chartUtils.js'

// 图表配置
const chartOptions = {
  animation: false,
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
    formatter: function (params) {
      const data = params[0].data
      if (!data) return ''
      
      const date = new Date(data[0])
      const y = date.getFullYear()
      const m = String(date.getMonth() + 1).padStart(2, '0')
      const d = String(date.getDate()).padStart(2, '0')
      
      return [
        `日期: ${y}-${m}-${d}`,
        `开盘: ${data[1]}`,
        `最高: ${data[2]}`,
        `最低: ${data[3]}`,
        `收盘: ${data[4]}`
      ].join('<br/>')
    }
  },
  grid: {
    left: '10%',
    right: '10%',
    bottom: '15%'
  },
  xAxis: {
    type: 'category',
    scale: true,
    boundaryGap: false,
    axisLine: { onZero: false },
    splitLine: { show: false },
    axisLabel: {
      formatter: function (value) {
        if (!value) return ''
        const date = new Date(value)
        const m = String(date.getMonth() + 1).padStart(2, '0')
        const d = String(date.getDate()).padStart(2, '0')
        return `${m}-${d}`
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
      start: 0,
      end: 100
    },
    {
      show: true,
      type: 'slider',
      top: '90%',
      start: 0,
      end: 100
    }
  ],
  series: [
    {
      name: '日线数据',
      type: 'candlestick',
      itemStyle: {
        color: '#00da3c',
        color0: '#ec0000',
        borderColor: '#00da3c',
        borderColor0: '#ec0000'
      }
    },
    {
      name: 'MA5',
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 1 },
      itemStyle: { color: '#d87c7c' }
    },
    {
      name: 'MA10',
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 1 },
      itemStyle: { color: '#919e8b' }
    },
    {
      name: 'MA20',
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 1 },
      itemStyle: { color: '#7b9ce1' }
    },
    {
      name: 'MA30',
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: { width: 1 },
      itemStyle: { color: '#73c0de' }
    }
  ]
}

// 数据映射配置
const dataMap = {
  xField: 0,  // 日期字段
  yField: 4,   // 收盘价字段
  '日线数据': 'chartData',
  'MA5': 'ma5',
  'MA10': 'ma10',
  'MA20': 'ma20',
  'MA30': 'ma30'
}

// 处理图表数据，计算MA线
const processChartData = (data) => {
  if (!data || !Array.isArray(data)) return { data: [] }
  
  // 提取收盘价
  const closePrices = data.map(item => item[4])
  
  // 计算各周期MA线
  const ma5 = calculateMA(closePrices, 5)
  const ma10 = calculateMA(closePrices, 10)
  const ma20 = calculateMA(closePrices, 20)
  const ma30 = calculateMA(closePrices, 30)
  
  // 将MA值与对应的时间点配对
  const ma5Data = data.map((item, index) => [item[0], ma5[index]])
  const ma10Data = data.map((item, index) => [item[0], ma10[index]])
  const ma20Data = data.map((item, index) => [item[0], ma20[index]])
  const ma30Data = data.map((item, index) => [item[0], ma30[index]])
  
  return {
    chartData: data,
    ma5: ma5Data,
    ma10: ma10Data,
    ma20: ma20Data,
    ma30: ma30Data
  }
}

// 暴露给父组件的方法 - 调整图表大小
const resize = () => {
  if (chartRef.value) {
    chartRef.value.resize()
  }
}

// 暴露给父组件的方法 - 销毁图表
const dispose = () => {
  if (chartRef.value) {
    chartRef.value.dispose()
  }
}

// 向父组件暴露方法
defineExpose({
  resize,
  dispose
})
</script>

<template>
  <BaseChart
    ref="chartRef"
    :title="chartTitle"
    :data="chartData"
    chart-type="line"
    :options="chartOptions"
    :data-map="dataMap"
    color="#10b981"
  />
</template>