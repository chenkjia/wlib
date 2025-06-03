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
    // TODO: 发起后端请求获取详细信息
    console.log('信号数据变化，准备请求详情：', newSignal)
  }
}, { immediate: true })
</script>

<style scoped>
.signal-detail {
  padding: 1rem;
}
</style>