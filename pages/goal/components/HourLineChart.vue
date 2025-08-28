<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import * as echarts from 'echarts'
import BaseChart from '../../../components/BaseChart.vue'
import { calculateHourMetric } from '../../../utils/chartUtils.js'

// 接收父组件传递的目标数据
const props = defineProps({
  goal: {
    type: Object,
    required: true
  }
})

// 组件挂载时的调试信息
onMounted(() => {
  if (process.client) {
    console.log('=== HourLineChart 组件挂载 ===')
    console.log('HourLineChart goal:', props.goal)
    // 在页面上显示调试信息
    if (typeof window !== 'undefined') {
      window.hourLineChartDebug = {
        mounted: true,
        hasGoal: !!props.goal,
        goalStockCode: props.goal?.stockCode
      }
    }
  }
  if (props.goal && props.goal.stockCode) {
    console.log('HourLineChart onMounted: 调用 fetchHourLineData，参数:', {
      stockCode: props.goal.stockCode,
      startTime: props.goal.startTime,
      endTime: props.goal.endTime
    })
    fetchHourLineData(props.goal.stockCode, props.goal.startTime, props.goal.endTime)
  } else {
    console.warn('HourLineChart onMounted: goal 或 stockCode 不存在')
  }
})

// 引用BaseChart组件
const chartRef = ref(null)

// 图表数据
const chartData = ref(null)

// 计算MA数据
const maData = computed(() => {
  if (!chartData.value || !Array.isArray(chartData.value)) {
    return {}
  }
  return calculateHourMetric(chartData.value, { s: 7, m: 14, l: 50, xl: 100 })
})

// 获取小时线数据的函数
const fetchHourLineData = async (stockCode, startTime, endTime) => {
  // 参数验证
  if (!stockCode || stockCode === 'undefined') {
    console.error('HourLineChart fetchHourLineData: stockCode 为空或 undefined:', stockCode)
    return null
  }
  
  try {
    console.log('HourLineChart: 开始获取小时线数据', { stockCode, startTime, endTime })
    const params = new URLSearchParams({
      code: stockCode
    })
    if (startTime) params.append('startTime', startTime)
    if (endTime) params.append('endTime', endTime)
    
    console.log('HourLineChart: 请求 URL:', `/api/hourLine?${params}`)
    const response = await fetch(`/api/hourLine?${params}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    console.log('HourLineChart: 成功获取小时线数据，长度:', data?.length || 0)
    
    // 处理获取到的数据
    if (data && Array.isArray(data) && data.length > 0) {
      console.log('HourLineChart: 处理小时线数据，长度:', data.length)
      // 转换数据格式为图表需要的格式
      const formattedData = data.map(item => [
        new Date(item.time).getTime(),
        item.close
      ])
      chartData.value = processChartData(formattedData)
      console.log('HourLineChart: 图表数据设置完成')
    } else {
      console.log('HourLineChart: 没有获取到有效的小时线数据')
      chartData.value = null
    }
    
    return data
  } catch (error) {
    console.error('HourLineChart: 获取小时线数据失败:', error)
    chartData.value = null
    return null
  }
}

// 监听goal变化，获取对应的小时线数据
watch(() => props.goal, async (newGoal) => {
  console.log('HourLineChart: goal数据变化', newGoal)
  if (newGoal && newGoal.stockCode) {
    console.log('HourLineChart: 开始获取股票小时线数据:', newGoal.stockCode)
    // 获取小时线数据（数据处理已在 fetchHourLineData 函数中完成）
    await fetchHourLineData(
      newGoal.stockCode,
      newGoal.startTime,
      newGoal.endTime
    )
  } else {
    console.log('HourLineChart: goal数据无效或缺少stockCode')
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
    :data="chartData"
    :ma-data="maData"
  />
</template>