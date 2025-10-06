<template>
  <div>
    <div class="flex justify-between items-center p-2">
      <h4 class="font-medium text-gray-700">任务列表</h4>
      <div class="flex gap-2">
        <UButton
          @click="refresh" 
          label="刷新"
          :icon="loading ? 'i-lucide-loader-2' : 'i-lucide-refresh-cw'"
          :loading="loading"
          color="info"
          size="sm"
          class="flex items-center"
        />
        <UButton
          @click="changePanelState" 
          :label="props.panelState === 'expanded' ? '恢复' : '展开'"
          :icon="props.panelState === 'expanded' ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
          color="success"
          size="sm"
        />
      </div>
    </div>
    
    <!-- 搜索和过滤 -->
    <div class="p-2 flex gap-3">
      <div class="relative flex-1">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索任务名称"
          class="w-full px-3 py-2 pl-10 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <!-- 搜索图标 -->
        <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
      
      <!-- 状态过滤 -->
      <div class="w-1/3">
        <select
          v-model="statusFilter"
          @change="fetchTasks()"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="">全部状态</option>
          <option value="pending">等待中</option>
          <option value="processing">进行中</option>
          <option value="completed">已完成</option>
          <option value="failed">失败</option>
        </select>
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
        @click="fetchTasks" 
        class="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      >
        重试
      </button>
    </div>
    
    <!-- Nuxt UI Table 任务列表 -->
    <div v-else>
      <UTable 
        :data="tasks" 
        :columns="columns"
        :loading="loading"
        :column-visibility="columnVisibility"
        class="w-full"
        :ui="{
          wrapper: 'border border-gray-200 rounded-lg overflow-hidden',
          td: {
            base: 'p-3 border-b border-gray-100',
            padding: 'px-4 py-3'
          },
          th: {
            base: 'text-left p-3 border-b border-gray-200 bg-gray-50',
            padding: 'px-4 py-3',
            color: 'text-gray-700 font-medium'
          }
        }"
        :column-pinning="{left: ['name'], right: ['actions','params','stockCount']}"
      >
        <template #params-cell="{ row }">
          <div class="flex gap-2">
            <UButton
              @click="useTaskParams(row.original)" 
              icon="i-lucide-code-2"
              color="info"
              size="xs"
              title="使用此任务参数"
            />
            <UButton
              v-show="props.panelState === 'expanded'"
              @click="watchParams(row.original)" 
              icon="i-lucide-eye"
              color="info"
              size="xs"
              title="查看此任务参数"
            />
          </div>
        </template>
        
        <template #name-cell="{ row }">
          <div class="flex items-center">
            <span v-if="editingTaskId !== row.original._id" @click="startEditTaskName(row.original)" class="cursor-pointer hover:text-blue-500">
              {{ row.original.name }}
            </span>
            <div v-else class="flex items-center">
              <input 
                v-model="editingTaskName" 
                @keyup.enter="saveTaskName(row.original._id)" 
                @blur="saveTaskName(row.original._id)"
                class="border border-gray-300 rounded px-2 py-1 text-sm w-full" 
                ref="taskNameInput"
              />
            </div>
          </div>
        </template>
        <template #createdAt-cell="{ row }">
          {{ formatDate(row.original.createdAt) }}
        </template>
        <!-- 数据开始 -->
        <template #totalTrades-cell="{ row }">
          {{ row.original.result?.totalTrades !== undefined ? row.original.result.totalTrades.toFixed(2) : '-' }}
        </template>
        <template #profitTrades-cell="{ row }">
          <span class='text-green-600'>{{ row.original.result?.profitTrades !== undefined ? row.original.result.profitTrades.toFixed(2) : '-' }}</span>
          /
          <span class='text-red-600'>{{ row.original.result?.lossTrades !== undefined ? row.original.result.lossTrades.toFixed(2) : '-' }}</span>
        </template>
        <template #winRate-cell="{ row }">
          <span v-if="row.original.result?.winRate !== undefined" 
                :class="row.original.result.winRate >= 0.5 ? 'text-green-600' : 'text-red-600'">
            {{ (row.original.result.winRate * 100).toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        <template #daysDuration-cell="{ row }">
          {{ row.original.result?.daysDuration !== undefined ? row.original.result.daysDuration.toFixed(2) : '-' }}
        </template>
        
        <template #priceChange-cell="{ row }">
          <span v-if="row.original.result?.priceChange !== undefined" 
                :class="row.original.result.priceChange > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.result.priceChange.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #dailyChange-cell="{ row }">
          <span v-if="row.original.result?.dailyChange !== undefined" 
                :class="row.original.result.dailyChange > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.result.dailyChange.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #maxDrawdown-cell="{ row }">
          <span v-if="row.original.result?.maxDrawdown !== undefined" class="text-red-600">
            {{ row.original.result.maxDrawdown.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #dayLineCount-cell="{ row }">
          {{ row.original.result?.dayLineCount !== undefined ? row.original.result.dayLineCount.toFixed(2) : '-' }}
        </template>
        
        <template #dayLinePriceChange-cell="{ row }">
          <span v-if="row.original.result?.dayLinePriceChange !== undefined" 
                :class="row.original.result.dayLinePriceChange > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.result.dayLinePriceChange.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #dayLineDailyChange-cell="{ row }">
          <span v-if="row.original.result?.dayLineDailyChange !== undefined" 
                :class="row.original.result.dayLineDailyChange > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.result.dayLineDailyChange.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #priceChangeDiff-cell="{ row }">
          <span v-if="row.original.result?.priceChangeDiff !== undefined" 
                :class="row.original.result.priceChangeDiff > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.result.priceChangeDiff.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        
        <template #dailyChangeDiff-cell="{ row }">
          <span v-if="row.original.result?.dailyChangeDiff !== undefined" 
                :class="row.original.result.dailyChangeDiff > 0 ? 'text-green-600' : 'text-red-600'">
            {{ row.original.result.dailyChangeDiff.toFixed(2) }}%
          </span>
          <span v-else>-</span>
        </template>
        <!-- 数据结束 -->
        
        <template #actions-cell="{ row }">
          <UButton
            @click.stop="deleteTask(row.original._id)" 
            icon="i-lucide-trash-2"
            color="error"
            size="xs"
          />
        </template>
        
        <template #empty-state>
          <div class="py-4 text-center text-gray-500">
            <p>没有找到匹配的任务</p>
          </div>
        </template>
        
        <!-- 状态列自定义渲染 -->
        <template #status-cell="{ row }">
            <!-- 如果是待处理或进行中状态，显示进度条 -->
          <div v-if="['pending', 'processing'].includes(row.original.status) && row.original.progress !== undefined" class="w-[50px]">
            <UProgress 
              :value="row.original.progress" 
              :max="100"
              :color="row.original.status === 'processing' ? 'primary' : 'gray'"
              class="w-full"
            />
            <div class="text-xs text-gray-500 text-right">{{ row.original.progress }}%</div>
          </div>
          <div v-else class="flex flex-col gap-1">
            <UBadge
              :color="getStatusColor(row.original.status)"
              :text="getStatusText(row.original.status)"
              size="sm"
            >
              {{ getStatusText(row.original.status) }}
            </UBadge>
            
          </div>
        </template>
        <template #stockCount-cell="{ row }">
          <UButton
            v-if="row.original.params?.type === 'star'"
            variant="ghost"
            color="neutral"
            class="mr-2"
            size="xs"
            @click="row.toggleExpanded()"
          >
            {{ row.original.result.stockCount }}
          </UButton>
          <span v-else>{{ row.original.result.stockCount }}</span>
        </template>
        <template #expanded="{ row }">
          <StockResultTable
            :stocksResult="row.original.stocksResult"
            @changeViewStock="$emit('changeViewStock',$event)"
          />
        </template>
      </UTable>
      
      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="p-2 border-t flex items-center justify-between" style="border-color: var(--border-light);">
        <div class="text-sm text-gray-500">
          第 {{ currentPage }} 页，共 {{ totalPages }} 页
        </div>
        <UPagination
          v-model="currentPage"
          :total="totalCount"
          :page-count="totalPages"
          :per-page="pageSize"
          :ui="{ wrapper: 'flex gap-1' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useDebounce } from '@vueuse/core'
import StockResultTable from './StockResultTable.vue'

const props = defineProps({
  panelState: {
    type: String,
    default: 'normal'
  }
})

const emit = defineEmits(['useTaskParams', 'changeViewStock', 'changePanelState'])

// 使用任务参数
const useTaskParams = (task) => {
  if (task && task.params) {
    emit('useTaskParams', task.params)
  }
}

// 状态变量
const searchQuery = ref('')
const statusFilter = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const loading = ref(false)
const error = ref(null)
const tasks = ref([])
const totalCount = ref(0)
const expandedTasks = ref([]) // 存储已展开的任务ID
const editingTaskId = ref(null) // 当前正在编辑的任务ID
const editingTaskName = ref('') // 编辑中的任务名称
const taskNameInput = ref(null) // 任务名称输入框引用
const expandedRows = ref(new Set()) // 存储已展开的行ID

// 计算属性
const totalPages = computed(() => Math.ceil(totalCount.value / pageSize.value))
const displayedTasks = computed(() => tasks.value)

// 根据面板状态控制列的可见性
const columnVisibility = computed(() => {
  if (props.panelState === 'expanded') {
    // 扩展状态下显示所有列
    return {
      name: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      params: true,
      totalTrades: true,
      profitTrades: true,
      winRate: true,
      daysDuration: true,
      priceChange: true,
      dailyChange: true,
      maxDrawdown: true,
      dayLineCount: true,
      dayLinePriceChange: true,
      dayLineDailyChange: true,
      priceChangeDiff: true,
      dailyChangeDiff: true,
      actions: true
    }
  } else {
    // 默认状态下只显示名称和状态列
    return {
      name: true,
      status: true,
      createdAt: false,
      updatedAt: false,
      params: true,
      totalTrades: false,
      profitTrades: false,
      winRate: false,
      daysDuration: false,
      priceChange: false,
      dailyChange: true,
      maxDrawdown: false,
      dayLineCount: false,
      dayLinePriceChange: false,
      dayLineDailyChange: false,
      priceChangeDiff: false,
      dailyChangeDiff: true,
      actions: false
    }
  }
})

// 开始编辑任务名称
function startEditTaskName(task) {
  editingTaskId.value = task._id
  editingTaskName.value = task.name
  // 下一个tick后聚焦输入框
  nextTick(() => {
    if (taskNameInput.value) {
      taskNameInput.value.focus()
    }
  })
}

// 保存任务名称
async function saveTaskName(taskId) {
  if (!editingTaskName.value.trim()) {
    editingTaskId.value = null
    return
  }
  
  try {
    const response = await fetch(`/api/task/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: editingTaskName.value.trim()
      })
    })
    
    if (!response.ok) {
      throw new Error(`更新任务名称失败: ${response.status} ${response.statusText}`)
    }
    
    // 更新本地任务列表中的名称
    const taskIndex = tasks.value.findIndex(t => t._id === taskId)
    if (taskIndex !== -1) {
      tasks.value[taskIndex].name = editingTaskName.value.trim()
    }
  } catch (err) {
    console.error('更新任务名称错误:', err)
    error.value = err.message
  } finally {
    editingTaskId.value = null
  }
}

// 表格列定义
const columns = ref([
  {
    accessorKey: 'params',
    header: '参数',
    id: 'params'
  },
  {
    accessorKey: 'name',
    header: '任务名称',
    id: 'name'
  },
  {
    accessorKey: 'status',
    header: '状态',
    id: 'status'
  },
  {
    accessorKey: 'result.stockCount',
    header: '股数',
    id: 'stockCount'
  },
  {
    accessorKey: 'result.winRate',
    header: '胜率',
    id: 'winRate'
  },
  {
    accessorKey: 'result.dailyChange',
    header: '交易日均',
    id: 'dailyChange'
  },
  {
    accessorKey: 'result.dailyChangeDiff',
    header: '日均差值',
    id: 'dailyChangeDiff'
  },
  {
    accessorKey: 'result.dayLineDailyChange',
    header: '日线日均',
    id: 'dayLineDailyChange'
  },
  {
    accessorKey: 'result.totalTrades',
    header: '交易笔数',
    id: 'totalTrades'
  },
  {
    accessorKey: 'result.profitTrades',
    header: '盈/亏',
    id: 'profitTrades'
  },
  {
    accessorKey: 'result.daysDuration',
    header: '交易总天数',
    id: 'daysDuration'
  },
  {
    accessorKey: 'result.priceChange',
    header: '交易总涨跌幅',
    id: 'priceChange'
  },
  {
    accessorKey: 'result.maxDrawdown',
    header: '最大回撤',
    id: 'maxDrawdown'
  },
  {
    accessorKey: 'result.dayLineCount',
    header: '日线总天数',
    id: 'dayLineCount'
  },
  {
    accessorKey: 'result.dayLinePriceChange',
    header: '日线总涨跌幅',
    id: 'dayLinePriceChange'
  },
  {
    accessorKey: 'result.priceChangeDiff',
    header: '涨跌幅差值',
    id: 'priceChangeDiff'
  },
  {
    accessorKey: 'createdAt',
    header: '创建时间',
    id: 'createdAt'
  },
  {
    id: 'actions',
    header: '操作',
    cell: (row) => row.id
  }
])

// 防抖搜索
const debouncedSearch = useDebounce(searchQuery, 500)

// 监听搜索和页码变化
watch([debouncedSearch, currentPage], () => {
  fetchTasks()
})

// 获取任务列表
async function fetchTasks() {
  loading.value = true
  error.value = null
  
  try {
    const params = new URLSearchParams()
    params.append('page', currentPage.value.toString())
    params.append('pageSize', pageSize.value.toString())
    
    if (searchQuery.value) {
      params.append('name', searchQuery.value)
    }
    
    if (statusFilter.value) {
      params.append('status', statusFilter.value)
    }
    
    console.log('Fetching tasks with params:', params.toString())
    const response = await fetch(`/api/task?${params.toString()}`)
    
    if (!response.ok) {
      throw new Error(`获取任务列表失败: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    console.log('Task data received:', data)
    
    // API返回的是data字段
    tasks.value = data.data || []
    totalCount.value = data.total || 0
  } catch (error) {
    console.error('获取任务列表错误:', error)
    error.value = error.message
  } finally {
    loading.value = false
  }
}

// 刷新任务列表 - 供外部调用
function refresh() {
  fetchTasks()
}

// 删除任务
async function deleteTask(taskId) {
  if (!confirm('确定要删除此任务吗？')) {
    return
  }
  
  loading.value = true
  error.value = null
  
  try {
    const response = await fetch(`/api/task/${taskId}`, {
      method: 'DELETE'
    })
    
    if (!response.ok) {
      throw new Error(`删除任务失败: ${response.status} ${response.statusText}`)
    }
    
    // 删除成功后刷新任务列表
    fetchTasks()
  } catch (err) {
    console.error('删除任务错误:', err)
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  refresh
})

// 切换任务展开状态
function toggleTaskExpand(taskId) {
  const index = expandedTasks.value.indexOf(taskId)
  if (index === -1) {
    expandedTasks.value.push(taskId)
  } else {
    expandedTasks.value.splice(index, 1)
  }
}

// 切换任务页码
function changePage(page) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const statusMap = {
  'pending': {
    color: 'primary',
    text: '等待中'
  },
  'processing': {
    color: 'info',
    text: '进行中'
  },
  'completed': {
    color: 'success',
    text: '已完成'
  },
  'failed': {
    color: 'error',
    text: '失败'
  }
}
function getStatusColor(status) {
  return statusMap[status]?.color || 'neutral'
}
function getStatusText(status) {
  return statusMap[status]?.text || status
}
function changePanelState() {
  const newState = props.panelState === 'expanded' ? 'normal' : 'expanded'
  emit('changePanelState', newState)
}

// 日期格式化函数
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 初始加载任务列表
onMounted(() => {
  fetchTasks()
})
</script>