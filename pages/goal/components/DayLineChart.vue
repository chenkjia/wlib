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
  return await res.json()
}
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