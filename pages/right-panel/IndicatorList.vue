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
          :availableIndicatorOptions="indicators"
          :calcMethodOptions="calcMethodOptions"
          :groupOptions="groupOptions"
          triggerLabel="新增指标"
          @submit="onModalSubmit"
          @cancel="onModalCancel"
        />
        <UButton
          v-if="props.panelState === 'rightExpanded'"
          @click="testCalculateMetric"
          label="测试计算指标"
          icon="i-lucide-flask-conical"
          color="primary"
          size="sm"
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
          v-model:column-visibility="columnVisibility"
          :data="indicators"
          :columns="columns"
          :loading="loading"
          class="w-full"
          :ui="{
            td: 'empty:p-0'
          }"
          :grouping="['group']"
          :grouping-options="groupingOptions"

          :column-pinning="{left: ['name','code'], right: ['actions']}"
        >
          <template #name-cell="{ row }">
            <div v-if="row.getIsGrouped()" class="flex items-center">
              <span class="inline-block" :style="{ width: `calc(${row.depth} * 1rem)` }" />

              <UButton
                variant="outline"
                color="neutral"
                class="mr-2"
                size="xs"
                :icon="row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus'"
                @click="row.toggleExpanded()"
              />
              <strong>{{ groupLabelMap[row.original.group] || row.original.group || '默认' }}</strong>
            </div>
            <div v-else>{{ row.original.name }}</div>
          </template>
          <template #code-cell="{ row }">
            <code v-if="!row.getIsGrouped()" class="text-gray-700">{{ row.original.code }}</code>
          </template>
          <template #usedIndicators-cell="{ row }">
            <div v-if="!row.getIsGrouped()"  class="flex flex-wrap gap-1">
              <UBadge v-for="(u, idx) in (row.original.usedIndicators || [])" :key="idx" :label="u" color="gray" size="xs" />
              <span v-if="!row.original.usedIndicators || row.original.usedIndicators.length === 0" class="text-gray-400">-</span>
            </div>
          </template>
          <template #calcMethod-cell="{ row }">
            <UBadge :label="row.original.calcMethod || '-'" color="primary" size="xs" />
          </template>
          <template #calcParams-cell="{ row }">
            <div v-if="!row.getIsGrouped()">
              <pre class="text-xs text-gray-600 whitespace-pre-wrap break-words">{{ formatJSON(row.original.calcParams) }}</pre>
            </div>
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
import { calculateIndicator, indicatorFunc } from '~/utils/chartUtils.js'
import { getGroupedRowModel } from '@tanstack/vue-table'

const props = defineProps({
  panelState: { type: String, default: 'normal' },
  ma: { type: Object, default: () => ({ s: 5, m: 10, l: 20, x: 60 }) },
  macd: { type: Object, default: () => ({ s: 12, l: 26, d: 9 }) },
  enabledIndicators: { type: Array, default: () => ['ma', 'macd'] }
})
const emit = defineEmits(['changePanelState'])

// 状态
const searchQuery = ref('')
const loading = ref(false)
const error = ref(null)
const indicators = ref([])
const indicatorModalOpen = ref(false)
const editingIndicator = ref(null)
const groupOptions = [
  { label: '默认', value: 'default' },
  { label: '均线', value: 'ma' },
  { label: 'MACD', value: 'macd' }
]
const groupLabelMap = groupOptions.reduce((result,{value,label}) => {
  return {
    ...result,
    [value]: label
  }
},{})
const groupingOptions = ref({
  groupedColumnMode: 'remove',
  getGroupedRowModel: getGroupedRowModel()
})

const columns = ref([
  { id: 'title', header: '组' },
  { accessorKey: 'group', header: '指标组', id: 'group' },
  { accessorKey: 'name', header: '名称', id: 'name', 
    cell: ({ row }) =>
      row.getIsGrouped() ? `${row.getValue('name')} 指标` : row.getValue('name')
  },
  { accessorKey: 'code', header: '代码', id: 'code' },
  { accessorKey: 'usedIndicators', header: '使用指标', id: 'usedIndicators' },
  { accessorKey: 'calcMethod', header: '计算方法', id: 'calcMethod' },
  { accessorKey: 'calcParams', header: '计算参数', id: 'calcParams' },
  { id: 'actions', header: '操作', cell: (row) => row.id }
])
const columnVisibility = ref({
  title: false,
  group: false
})
// 根据右栏展开状态控制列显示：不展开只显示 name、code、actions；展开显示所有（除 title、group 仍隐藏）
function applyColumnVisibilityByPanel(state) {
  const isExpanded = state === 'rightExpanded'
  columnVisibility.value = {
    // 始终隐藏分组辅助列
    title: false,
    group: false,
    // 展开时显示，收起时隐藏
    usedIndicators: isExpanded,
    calcMethod: isExpanded,
    calcParams: isExpanded
  }
}
watch(() => props.panelState, (state) => applyColumnVisibilityByPanel(state), { immediate: true })
const calcMethodOptions = computed(() => indicatorFunc)

watch(searchQuery, () => {
  fetchIndicators()
})

function changePanelState() {
  const newState = props.panelState === 'rightExpanded' ? 'normal' : 'rightExpanded'
  emit('changePanelState', newState)
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

// 测试计算指标：获取 sh.600000 两年内的日线数据并计算指标
async function testCalculateMetric() {
  try {
    const end = new Date()
    const start = new Date()
    start.setFullYear(end.getFullYear() - 2)
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

    const params = new URLSearchParams()
    params.append('code', 'sh.600000')
    params.append('startTime', fmt(start))
    params.append('endTime', fmt(end))

    loading.value = true
    const dayLine = await $fetch(`/api/dayLine?${params.toString()}`)
    // 直接使用当前表格中的指标配置进行计算
    const metrics = calculateIndicator(dayLine || [], indicators.value)
    console.log('测试指标计算结果(sh.600000 两年):', metrics)
  } catch (err) {
    console.error('测试计算指标错误:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

function formatJSON(val) {
  try {
    return JSON.stringify(val ?? {}, null, 2)
  } catch (e) {
    return String(val ?? '')
  }
}

onMounted(() => {
  fetchIndicators()
})
</script>

<style scoped>
/* 保持统一简洁风格 */
</style>