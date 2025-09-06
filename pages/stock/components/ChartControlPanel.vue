<template>
  <div class="absolute top-0 left-0 right-0 z-20 flex flex-row items-center flex-wrap p-3 overflow-x-auto" style="background: linear-gradient(135deg, var(--primary-800) 0%, var(--primary-700) 100%); backdrop-filter: blur(10px);">
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex items-center px-3 py-2 rounded-lg" style="background-color: var(--primary-900); color: white;">
        <label for="trendInterval" class="mr-2 text-sm font-medium">趋势间隔:</label>
        <input 
          id="trendInterval"
          v-model.number="localTrendInterval" 
          type="number" 
          min="1" 
          max="30" 
          class="w-16 px-2 py-1 text-sm rounded border-0 focus:ring-2 focus:ring-blue-400" 
          style="background-color: var(--primary-700); color: white;" 
        />
      </div>
      
      <div class="flex items-center px-3 py-2 rounded-lg" style="background-color: var(--primary-900); color: white;">
        <label for="profitFilter" class="mr-2 text-sm font-medium">利润(%):</label>
        <input 
          id="profitFilter"
          v-model.number="localProfitFilter" 
          type="number" 
          min="0" 
          step="0.1"
          class="w-20 px-2 py-1 text-sm rounded border-0 focus:ring-2 focus:ring-blue-400" 
          style="background-color: var(--primary-700); color: white;" 
        />
      </div>
      
      <div class="flex items-center px-3 py-2 rounded-lg" style="background-color: var(--primary-900); color: white;">
        <label for="dailyProfitFilter" class="mr-2 text-sm font-medium">日均(%):</label>
        <input 
          id="dailyProfitFilter"
          v-model.number="localDailyProfitFilter" 
          type="number" 
          min="0" 
          step="0.01"
          class="w-20 px-2 py-1 text-sm rounded border-0 focus:ring-2 focus:ring-blue-400" 
          style="background-color: var(--primary-700); color: white;" 
        />
      </div>
      
      <div class="flex items-center px-3 py-2 rounded-lg" style="background-color: var(--primary-900); color: white;">
        <label for="durationFilter" class="mr-2 text-sm font-medium">天数:</label>
        <input 
          id="durationFilter"
          v-model.number="localDurationFilter" 
          type="number" 
          min="0" 
          step="1"
          class="w-16 px-2 py-1 text-sm rounded border-0 focus:ring-2 focus:ring-blue-400" 
          style="background-color: var(--primary-700); color: white;" 
        />
      </div>
      
      <div class="flex items-center px-3 py-2 rounded-lg" style="background-color: var(--primary-900); color: white;">
        <label for="liquidityFilter" class="mr-2 text-sm font-medium">流动性(万):</label>
        <input 
          id="liquidityFilter"
          v-model.number="localLiquidityFilter" 
          type="number" 
          min="0" 
          step="0.1"
          class="w-20 px-2 py-1 text-sm rounded border-0 focus:ring-2 focus:ring-blue-400" 
          style="background-color: var(--primary-700); color: white;" 
        />
      </div>
      
      <button 
        @click="emitRefresh"
        class="finance-btn-primary px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200"
        title="刷新数据"
      >
        刷新
      </button>
    </div>
    
    <button 
      @click="$emit('toggleFullScreen')"
      class="px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ml-auto"
      style="background-color: var(--success); color: white;"
      :title="isFullScreen ? '退出全屏' : '全屏显示'"
      @mouseover="$event.target.style.backgroundColor = '#059669'"
      @mouseout="$event.target.style.backgroundColor = 'var(--success)'"
    >
      {{ isFullScreen ? '退出全屏' : '全屏' }}
    </button>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  trendInterval: {
    type: Number,
    default: 40
  },
  profitFilter: {
    type: Number,
    default: 50
  },
  dailyProfitFilter: {
    type: Number,
    default: 2
  },
  durationFilter: {
    type: Number,
    default: 7
  },
  liquidityFilter: {
    type: Number,
    default: 100
  },
  isFullScreen: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits([
  'update:trendInterval',
  'update:profitFilter',
  'update:dailyProfitFilter',
  'update:durationFilter',
  'update:liquidityFilter',
  'refresh',
  'toggleFullScreen'
])

// 本地状态，用于双向绑定
const localTrendInterval = ref(props.trendInterval)
const localProfitFilter = ref(props.profitFilter)
const localDailyProfitFilter = ref(props.dailyProfitFilter)
const localDurationFilter = ref(props.durationFilter)
const localLiquidityFilter = ref(props.liquidityFilter)

// 监听本地状态变化，更新父组件
watch(localTrendInterval, (newValue) => {
  if (newValue < 1) localTrendInterval.value = 1
  if (newValue > 60) localTrendInterval.value = 60
  emit('update:trendInterval', localTrendInterval.value)
})

watch(localProfitFilter, (newValue) => {
  emit('update:profitFilter', newValue)
})

watch(localDailyProfitFilter, (newValue) => {
  emit('update:dailyProfitFilter', newValue)
})

watch(localDurationFilter, (newValue) => {
  emit('update:durationFilter', newValue)
})

watch(localLiquidityFilter, (newValue) => {
  emit('update:liquidityFilter', newValue)
})

// 监听props变化，更新本地状态
watch(() => props.trendInterval, (newValue) => {
  localTrendInterval.value = newValue
})

watch(() => props.profitFilter, (newValue) => {
  localProfitFilter.value = newValue
})

watch(() => props.dailyProfitFilter, (newValue) => {
  localDailyProfitFilter.value = newValue
})

watch(() => props.durationFilter, (newValue) => {
  localDurationFilter.value = newValue
})

watch(() => props.liquidityFilter, (newValue) => {
  localLiquidityFilter.value = newValue
})

// 触发刷新事件
function emitRefresh() {
  emit('update:trendInterval', localTrendInterval.value)
  emit('update:profitFilter', localProfitFilter.value)
  emit('update:dailyProfitFilter', localDailyProfitFilter.value)
  emit('update:durationFilter', localDurationFilter.value)
  emit('update:liquidityFilter', localLiquidityFilter.value)
  emit('refresh')
}
</script>

<style scoped>
/* 全屏图标 */
.icon-fullscreen::before {
  content: '\2922';
  font-style: normal;
  font-size: 16px;
}

.icon-fullscreen-exit::before {
  content: '\2923';
  font-style: normal;
  font-size: 16px;
}
</style>