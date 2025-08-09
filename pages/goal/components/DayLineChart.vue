<script setup>
import { ref, watch, computed } from 'vue'
import BaseChart from '../../../components/BaseChart.vue'
import { calculateDayMetric } from '../../../utils/chartUtils.js'

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

// 计算MA数据
const maData = computed(() => {
  if (!chartData.value || !Array.isArray(chartData.value)) {
    return {}
  }
  return calculateDayMetric(chartData.value, { s: 7, m: 30, l: 60, x: 150 })
})

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
  return await res.json()
}

// 暴露方法给父组件
defineExpose({
  resize: () => chartRef.value?.resize(),
  dispose: () => chartRef.value?.dispose(),
  toggleFullscreen: () => chartRef.value?.toggleFullscreen()
})
</script>

<template>
  <BaseChart
    ref="chartRef"
    :data="chartData"
    :ma-data="maData"
  />
</template>