<script setup>
import { ref, watch } from 'vue'
import * as echarts from 'echarts'
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
watch(() => props.goal, (newGoal) => {
  if (newGoal && newGoal.hourLine && Array.isArray(newGoal.hourLine)) {
    // 使用processChartData处理数据
    chartData.value = processChartData(newGoal.hourLine)
  } else {
    chartData.value = null
  }
}, { immediate: true })

// 图表标题
const chartTitle = '小时线示例'

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
      const h = String(date.getHours()).padStart(2, '0')
      const min = String(date.getMinutes()).padStart(2, '0')
      
      return [
        `时间: ${y}-${m}-${d} ${h}:${min}`,
        `价格: ${data[1]}`
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
        const h = String(date.getHours()).padStart(2, '0')
        const m = String(date.getMinutes()).padStart(2, '0')
        return `${h}:${m}`
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
      name: '小时数据',
      type: 'line',
      smooth: true,
      showSymbol: false,
      lineStyle: {
        width: 2
      },
      itemStyle: {
        color: '#3b82f6'
      },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: 'rgba(59, 130, 246, 0.5)'
          },
          {
            offset: 1,
            color: 'rgba(59, 130, 246, 0.1)'
          }
        ])
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
    }
  ]
}

// 数据映射配置
const dataMap = {
  xField: 0,  // 时间字段
  yField: 1,   // 价格字段
  '小时数据': 'chartData',
  'MA5': 'ma5',
  'MA10': 'ma10',
  'MA20': 'ma20'
}

// 处理图表数据，计算MA线
const processChartData = (data) => {
  if (!data || !Array.isArray(data)) return { data: [] }
  
  // 提取价格数据（假设是第二个元素）
  const prices = data.map(item => item[1])
  
  // 计算各周期MA线
  const ma5 = calculateMA(prices, 5)
  const ma10 = calculateMA(prices, 10)
  const ma20 = calculateMA(prices, 20)
  
  // 将MA值与对应的时间点配对
  const ma5Data = data.map((item, index) => [item[0], ma5[index]])
  const ma10Data = data.map((item, index) => [item[0], ma10[index]])
  const ma20Data = data.map((item, index) => [item[0], ma20[index]])
  
  return {
    chartData: data,
    ma5: ma5Data,
    ma10: ma10Data,
    ma20: ma20Data
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
    color="#3b82f6"
  />
</template>