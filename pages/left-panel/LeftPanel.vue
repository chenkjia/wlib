<template>
  <div class="w-full h-full flex flex-col">
    <!-- 数据源切换 -->
    <div class="p-3 border-b" style="border-color: var(--border-light);">
      <div class="flex items-center gap-2">
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">数据源:</label>
        <USelectMenu
          v-model="selectedDataSource"
          :items="dataSourceOptions"
          class="flex-1"
        />
      </div>
    </div>
    
    <!-- 标签页头部 -->
    <div class="flex border-b" style="border-color: var(--border-light);">
      <button
        @click="activeTab = 'stocks'"
        :class="[
          'flex-1 px-3 py-3 text-sm font-medium transition-colors',
          activeTab === 'stocks' 
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]"
      >
        股票列表
      </button>
      <button
        @click="activeTab = 'starred'"
        :class="[
          'flex-1 px-3 py-3 text-sm font-medium transition-colors',
          activeTab === 'starred' 
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]"
      >
        星标列表
      </button>
      <button
        @click="activeTab = 'tasks'"
        :class="[
          'flex-1 px-3 py-3 text-sm font-medium transition-colors',
          activeTab === 'tasks' 
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]"
      >
        任务列表
      </button>
    </div>

    <!-- 标签页内容 -->
    <div class="flex-1 overflow-hidden">
      <!-- 股票列表标签页 -->
      <div v-show="activeTab === 'stocks'" class="h-full">
        <StockList
          v-model:selectedStockCode="selectedStockCode"
          :selectedDataSource="selectedDataSource"
        />
      </div>

      <!-- 星标列表标签页 -->
      <div v-show="activeTab === 'starred'" class="h-full">
        <StarredStockList
          v-model:selectedStockCode="selectedStockCode"
          :selectedDataSource="selectedDataSource"
          :ma="props.ma"
          :macd="props.macd"
          :kdj="props.kdj"
          :bias="props.bias"
          :enabledIndicators="props.enabledIndicators"
          :buyConditions="props.buyConditions"
          :sellConditions="props.sellConditions"
        />
      </div>

      <!-- 任务列表标签页 -->
      <div v-show="activeTab === 'tasks'" class="h-full">
        <TaskList
          :panelState="panelState"
          @useTaskParams="emit('useTaskParams', $event)"
          @changeViewStock="emit('changeViewStock',$event)"
          @changePanelState="emit('changePanelState', $event)"
        />
      </div>
    </div>
    <div class="border-t px-3 py-2" style="border-color: var(--border-light);">
      <div class="grid grid-cols-2 gap-2">
        <UButton
          label="上一个"
          color="neutral"
          variant="soft"
          size="sm"
          :disabled="!canGoPrev"
          @click="goPrevStock"
        />
        <UButton
          label="下一个"
          color="primary"
          variant="soft"
          size="sm"
          :disabled="!canGoNext"
          @click="goNextStock"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import TaskList from './TaskList.vue'
import StockList from './StockList.vue'
import StarredStockList from './StarredStockList.vue'

// 定义 props 和 emits
const selectedStockCode = defineModel('selectedStockCode', { type: String, default: '' })
const panelState = defineModel('panelState', { type: String, default: 'normal' })
const selectedDataSource = defineModel('selectedDataSource', { type: Object, default: {
  value: 'alib',
  label: 'A股'
} })

// 新增算法参数props
const props = defineProps({
  ma: {
    type: Object,
    default: () => ({
      s: 5,
      m: 10,
      l: 20,
      x: 60
    })
  },
  macd: {
    type: Object,
    default: () => ({
      s: 12,
      l: 26,
      d: 9
    })
  },
  kdj: {
    type: Object,
    default: () => ({ n: 9, k: 3, d: 3 })
  },
  bias: {
    type: Object,
    default: () => ({ s: 6, m: 12, l: 24 })
  },
  enabledIndicators: {
    type: Array,
    default: () => ['ma', 'macd']
  },
  buyConditions: {
    type: Array,
    default: () => [['PRICE_GT_MAS']]
  },
  sellConditions: {
    type: Array,
    default: () => [['PRICE_LT_MAS']]
  }
})

const emit = defineEmits(['useTaskParams', 'changeViewStock', 'changePanelState'])

// 标签页状态
const activeTab = ref('stocks')
const allStockCodes = ref([])
const starredStockCodes = ref([])
const navLoading = ref(false)

// 数据源相关状态
const dataSourceOptions = [
  { value: 'flib', label: '加密货币' },
  { value: 'alib', label: 'A股' }
]

// 数据源切换处理
const handleDataSourceChange = (newDataSource) => {
  // 数据源切换逻辑由StockList组件处理
}

const currentNavCodes = computed(() => {
  if (activeTab.value === 'starred') return starredStockCodes.value
  if (activeTab.value === 'stocks') return allStockCodes.value
  return []
})

const currentNavIndex = computed(() => currentNavCodes.value.indexOf(selectedStockCode.value))
const canGoPrev = computed(() => !navLoading.value && currentNavCodes.value.length > 0 && currentNavIndex.value > 0)
const canGoNext = computed(() => !navLoading.value && currentNavCodes.value.length > 0 && currentNavIndex.value >= 0 && currentNavIndex.value < currentNavCodes.value.length - 1)

async function loadStockCodesForNavigation() {
  navLoading.value = true
  try {
    const stockResp = await fetch('/api/stocks?page=1&pageSize=5000&noCount=1')
    const stockData = await stockResp.json()
    allStockCodes.value = Array.isArray(stockData?.stocks) ? stockData.stocks.map(item => item.code).filter(Boolean) : []
  } catch (error) {
    allStockCodes.value = []
  } finally {
    navLoading.value = false
  }
}

async function loadStarredCodesForNavigation() {
  navLoading.value = true
  try {
    const starredResp = await fetch('/api/stocks/starred')
    const starredData = await starredResp.json()
    starredStockCodes.value = Array.isArray(starredData?.stocks) ? starredData.stocks.map(item => item.code).filter(Boolean) : []
  } catch (error) {
    starredStockCodes.value = []
  } finally {
    navLoading.value = false
  }
}

async function refreshNavCodes() {
  if (activeTab.value === 'starred') {
    await loadStarredCodesForNavigation()
    return
  }
  if (activeTab.value === 'stocks') {
    await loadStockCodesForNavigation()
    return
  }
}

function goPrevStock() {
  if (!canGoPrev.value) return
  const target = currentNavCodes.value[currentNavIndex.value - 1]
  if (target) selectedStockCode.value = target
}

function goNextStock() {
  if (!canGoNext.value) return
  const target = currentNavCodes.value[currentNavIndex.value + 1]
  if (target) selectedStockCode.value = target
}

// 监听数据源变化
watch(selectedDataSource, (newDataSource) => {
  if (newDataSource) {
    handleDataSourceChange(newDataSource)
    refreshNavCodes()
  }
})

watch(activeTab, () => {
  refreshNavCodes()
})

onMounted(() => {
  refreshNavCodes()
})
</script>

<style scoped>
/* 确保页面铺满屏幕 */
:deep(body), :deep(html) {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
  overflow-x: hidden;
}

/* 股票列表滚动区域 */
.overflow-y-auto {
  min-height: 200px;
  max-height: calc(100vh - 180px);
}
</style>
