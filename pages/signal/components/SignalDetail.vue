<template>
  <div class="signal-detail">
    <UCard>
      <template #header>
        <div class="text-xl font-bold">信号详情</div>
      </template>
      
      <div class="space-y-4">
        <div class="flex items-center">
          <span class="w-24 text-gray-600">股票代码：</span>
          <span>{{ stockCode }}</span>
        </div>
        <div class="flex items-center">
          <span class="w-24 text-gray-600">信号时间：</span>
          <span>{{ signalTime }}</span>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
const props = defineProps({
  signal: {
    type: Object,
    required: true
  }
})

const stockCode = computed(() => props.signal.stockCode)
const signalTime = computed(() => new Date(props.signal.signalTime).toLocaleString())

watch(() => props.signal, async (newSignal) => {
  if (newSignal) {
    // 计算startTime和endTime
    const signalDate = new Date(newSignal.signalTime)
    const startTime = new Date(signalDate.getTime() - 100 * 24 * 60 * 60 * 1000)
    const endTime = new Date(signalDate.getTime() + 200 * 24 * 60 * 60 * 1000)
    // 请求小时线数据
    const res = await fetch(`/api/hourLine?code=${newSignal.stockCode}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`)
    const hourLine = await res.json()
    console.log('小时线数据：', hourLine)
  }
}, { immediate: true })
</script>

<style scoped>
.signal-detail {
  padding: 1rem;
}
</style>