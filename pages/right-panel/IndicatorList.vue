<template>
  <div class="h-full flex flex-col">
    <!-- 搜索和过滤 -->
    <div class="p-2 flex gap-3 flex-shrink-0">
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索指标名称或代码"
          class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <!-- 按钮组 -->
      <div class="flex gap-2">
        <IndicatorModal
          v-model:open="indicatorModalOpen"
          :indicator="editingIndicator"
          :availableIndicatorOptions="availableIndicatorOptions"
          :calcMethodOptions="calcMethodOptions"
          triggerLabel="新增指标"
          @submit="onModalSubmit"
          @cancel="onModalCancel"
        />
        <UButton
          @click="changePanelState"
          :label="props.panelState === 'rightExpanded' ? '恢复' : '展开'"
          :icon="props.panelState === 'rightExpanded' ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
          color="success"
          size="sm"
        />
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="py-4 text-center">
      <div class="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
      <p class="mt-2">加载中...</p>
    </div>

    <!-- 错误信息 -->
    <div v-else-if="error" class="py-4 text-center text-red-500">
      <p>{{ error }}</p>
      <button
        @click="fetchIndicators"
        class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        重试
      </button>
    </div>

    <!-- 指标列表 -->
    <div v-else class="flex-grow flex flex-col min-h-0">
      <div class="flex-grow overflow-auto">
        <UTable
          :data="indicators"
          :columns="columns"
          :loading="loading"
          class="w-full"
          :ui="{
            wrapper: 'border border-gray-200 rounded-lg overflow-hidden',
            td: { base: 'p-3 border-b border-gray-100', padding: 'px-4 py-3' },
            th: { base: 'text-left p-3 border-b border-gray-200 bg-gray-50', padding: 'px-4 py-3', color: 'text-gray-700 font-medium' }
          }"
          :column-pinning="{left: ['name','code'], right: ['actions']}"
        >
          <template #name-cell="{ row }">
            {{ row.original.name }}
          </template>
          <template #code-cell="{ row }">
            <code class="text-gray-700">{{ row.original.code }}</code>
          </template>
          <template #usedIndicators-cell="{ row }">
            <div class="flex flex-wrap gap-1">
              <UBadge v-for="(u, idx) in (row.original.usedIndicators || [])" :key="idx" :label="u" color="gray" size="xs" />
              <span v-if="!row.original.usedIndicators || row.original.usedIndicators.length === 0" class="text-gray-400">-</span>
            </div>
          </template>
          <template #calcMethod-cell="{ row }">
            <UBadge :label="row.original.calcMethod || '-'" color="primary" size="xs" />
          </template>
          
          <template #actions-cell="{ row }">
            <div class="flex gap-2">
              <UButton @click="openEditModal(row.original)" icon="i-lucide-edit" color="info" size="xs" title="编辑" />
              <UButton @click="deleteIndicator(row.original.code)" icon="i-lucide-trash" color="error" size="xs" title="删除" />
            </div>
          </template>
        </UTable>
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import IndicatorModal from './IndicatorModal.vue'

const props = defineProps({
  panelState: { type: String, default: 'normal' }
})
const emit = defineEmits(['changePanelState'])

// 状态
const searchQuery = ref('')
const loading = ref(false)
const error = ref(null)
const indicators = ref([])
const indicatorModalOpen = ref(false)
const editingIndicator = ref(null)

const columns = ref([
  { accessorKey: 'name', header: '名称', id: 'name' },
  { accessorKey: 'code', header: '代码', id: 'code' },
  { accessorKey: 'usedIndicators', header: '使用指标', id: 'usedIndicators' },
  { accessorKey: 'calcMethod', header: '计算方法', id: 'calcMethod' },
  { id: 'actions', header: '操作', cell: (row) => row.id }
])

const availableIndicatorOptions = [
  { label: 'MA 均线', value: 'ma' },
  { label: 'MACD', value: 'macd' }
]
const calcMethodOptions = [
  { label: '简单移动平均 (SMA)', value: 'sma' },
  { label: '指数移动平均 (EMA)', value: 'ema' },
  { label: 'MACD 默认', value: 'macd_default' }
]

watch(searchQuery, () => {
  fetchIndicators()
})

function changePanelState() {
  const newState = props.panelState === 'rightExpanded' ? 'normal' : 'rightExpanded'
  emit('changePanelState', newState)
}

function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

async function fetchIndicators() {
  loading.value = true
  error.value = null
  try {
    const params = new URLSearchParams()
    if (searchQuery.value) params.append('search', searchQuery.value)
    const data = await $fetch(`/api/indicators?${params.toString()}`)
    indicators.value = data?.data || []
  } catch (err) {
    console.error('获取指标列表错误:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function openCreateModal() {
  editingIndicator.value = null
  indicatorModalOpen.value = true
}

function openEditModal(indicator) {
  editingIndicator.value = indicator
  indicatorModalOpen.value = true
}

// 子组件提交/取消事件
async function onModalSubmit({ payload, isEdit }) {
  try {
    await $fetch('/api/indicators', { method: isEdit ? 'PATCH' : 'POST', body: payload })
    indicatorModalOpen.value = false
    editingIndicator.value = null
    fetchIndicators()
  } catch (err) {
    console.error('提交指标错误:', err)
    error.value = err.message
  }
}
function onModalCancel() {
  indicatorModalOpen.value = false
  editingIndicator.value = null
}

async function deleteIndicator(code) {
  try {
    await $fetch('/api/indicators', { method: 'DELETE', query: { code } })
    fetchIndicators()
  } catch (err) {
    console.error('删除指标错误:', err)
    error.value = err.message
  }
}

onMounted(() => {
  fetchIndicators()
})
</script>

<style scoped>
/* 保持统一简洁风格 */
</style>