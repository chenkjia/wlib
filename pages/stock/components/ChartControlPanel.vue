<template>
  <div class="absolute top-0 left-0 right-0 z-20 flex flex-row items-center flex-wrap p-2 bg-gray-900 bg-opacity-80 overflow-x-auto">
    <div class="bg-gray-800 text-white p-1.5 rounded-md flex items-center mb-1 mr-1">
      <label for="trendInterval" class="mr-1 text-xs sm:text-sm">趋势间隔:</label>
      <div class="flex items-center">
        <input 
          id="trendInterval"
          v-model.number="localTrendInterval" 
          type="number" 
          min="1" 
          max="30" 
          class="w-10 sm:w-12 bg-gray-700 text-white rounded-l px-1 py-0.5 text-xs sm:text-sm" 
        />
        <button 
          class="bg-blue-600 hover:bg-blue-700 text-white rounded-r px-1 sm:px-2 py-0.5 text-xs sm:text-sm"
          @click="emitRefresh"
        >
          确认
        </button>
      </div>
    </div>
    
    <div class="bg-gray-800 text-white p-1.5 rounded-md flex items-center mb-1 mr-1">
      <label for="profitFilter" class="mr-1 text-xs sm:text-sm">利润(%):</label>
      <div class="flex items-center">
        <input 
          id="profitFilter"
          v-model.number="localProfitFilter" 
          type="number" 
          min="0" 
          step="0.1"
          class="w-12 sm:w-14 bg-gray-700 text-white rounded-l px-1 py-0.5 text-xs sm:text-sm" 
        />
        <button 
          class="bg-blue-600 hover:bg-blue-700 text-white rounded-r px-1 sm:px-2 py-0.5 text-xs sm:text-sm"
          @click="emitRefresh"
        >
          确认
        </button>
      </div>
    </div>
    
    <div class="bg-gray-800 text-white p-1.5 rounded-md flex items-center mb-1 mr-1">
      <label for="dailyProfitFilter" class="mr-1 text-xs sm:text-sm">日均(%):</label>
      <div class="flex items-center">
        <input 
          id="dailyProfitFilter"
          v-model.number="localDailyProfitFilter" 
          type="number" 
          min="0" 
          step="0.01"
          class="w-12 sm:w-14 bg-gray-700 text-white rounded-l px-1 py-0.5 text-xs sm:text-sm" 
        />
        <button 
          class="bg-blue-600 hover:bg-blue-700 text-white rounded-r px-1 sm:px-2 py-0.5 text-xs sm:text-sm"
          @click="emitRefresh"
        >
          确认
        </button>
      </div>
    </div>
    
    <div class="bg-gray-800 text-white p-1.5 rounded-md flex items-center mb-1 mr-1">
      <label for="durationFilter" class="mr-1 text-xs sm:text-sm">天数:</label>
      <div class="flex items-center">
        <input 
          id="durationFilter"
          v-model.number="localDurationFilter" 
          type="number" 
          min="0" 
          step="1"
          class="w-10 sm:w-12 bg-gray-700 text-white rounded-l px-1 py-0.5 text-xs sm:text-sm" 
        />
        <button 
          class="bg-blue-600 hover:bg-blue-700 text-white rounded-r px-1 sm:px-2 py-0.5 text-xs sm:text-sm"
          @click="emitRefresh"
        >
          确认
        </button>
      </div>
    </div>
    
    <div class="bg-gray-800 text-white p-1.5 rounded-md flex items-center mb-1 mr-1">
      <label for="liquidityFilter" class="mr-1 text-xs sm:text-sm">流动性(万):</label>
      <div class="flex items-center">
        <input 
          id="liquidityFilter"
          v-model.number="localLiquidityFilter" 
          type="number" 
          min="0" 
          step="1"
          class="w-12 sm:w-16 bg-gray-700 text-white rounded-l px-1 py-0.5 text-xs sm:text-sm" 
        />
        <button 
          class="bg-blue-600 hover:bg-blue-700 text-white rounded-r px-1 sm:px-2 py-0.5 text-xs sm:text-sm"
          @click="emitRefresh"
        >
          确认
        </button>
      </div>
    </div>
    
    <button 
      class="bg-gray-800 text-white p-1.5 rounded-md ml-auto mb-1"
      @click="$emit('toggleFullScreen')"
    >
      <i :class="isFullScreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'"></i>
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