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

const emit = defineEmits(['useTaskParams', 'changeViewStock', 'changePanelState'])

// 标签页状态
const activeTab = ref('stocks')

// 数据源相关状态
const dataSourceOptions = [
  { value: 'flib', label: '加密货币' },
  { value: 'alib', label: 'A股' }
]

// 数据源切换处理
const handleDataSourceChange = (newDataSource) => {
  // 数据源切换逻辑由StockList组件处理
}

// 监听数据源变化
watch(selectedDataSource, (newDataSource) => {
  if (newDataSource) {
    handleDataSourceChange(newDataSource)
  }
})

onMounted(() => {
  // 组件挂载时的初始化逻辑
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