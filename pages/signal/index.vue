<script setup>
import { ref, onMounted, watch } from 'vue'
import { h } from 'vue'
import SignalDetail from './components/SignalDetail.vue'
const UButton = resolveComponent('UButton')

function getHeader(column, label) {
  const isSorted = column.getIsSorted()

  return h(UButton, {
    color: 'neutral',
    variant: 'ghost',
    label,
    icon: isSorted
      ? isSorted === 'asc'
        ? 'i-lucide-arrow-up-narrow-wide'
        : 'i-lucide-arrow-down-wide-narrow'
      : 'i-lucide-arrow-up-down',
    class: '-mx-2.5',
    'aria-label': `排序 ${isSorted === 'asc' ? '降序' : '升序'}`,
    onClick: () => {
      if (isSorted === 'asc') {
        column.toggleSorting(true)
      } else if (isSorted === 'desc') {
        column.clearSorting()
      } else {
        column.toggleSorting(false)
      }
    }
  })
}
const signals = ref([])
const error = ref('')
const loading = ref(true)
const total = ref(0)
const page = ref(1)
const pageSize = ref(18)
const stockCode = ref('')
const selectedSignal = ref(null)

const sorting = ref([{
  id: 'signalTime',
  desc: false
}])

const columns = [
  { 
    accessorKey: 'stockCode', 
    header: ({ column }) => getHeader(column, '股票')
  },
  { 
    accessorKey: 'signalTime', 
    header: ({ column }) => getHeader(column, '信号时间'),
    cell: ({ row }) => new Date(row.getValue('signalTime')).toLocaleDateString()
  },
  { 
    accessorKey: 'signalPrice', 
    header: ({ column }) => getHeader(column, '信号价格')
  }
]

async function fetchSignals() {
  loading.value = true
  try {
    const params = new URLSearchParams({
      page: page.value.toString(),
      pageSize: pageSize.value.toString()
    })
    if (stockCode.value) {
      params.append('stockCode', stockCode.value)
    }
    if (sorting.value.length > 0) {
      const sort = sorting.value[0]
      params.append('sortBy', sort.id)
      params.append('sortOrder', sort.desc ? 'desc' : 'asc')
    }
    const response = await fetch(`/api/signals?${params}`)
    const data = await response.json()
    signals.value = data.data
    total.value = data.total
  } catch (err) {
    console.error('获取交易信号列表失败:', err)
    error.value = err.message || '获取交易信号列表失败'
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchSignals()
}

function toggleSort(id) {
  if (sorting.value[0]?.id === id) {
    if (!sorting.value[0].desc) {
      // 升序→降序
      sorting.value = [{ id, desc: true }]
    } else {
      // 降序→无排序
      sorting.value = []
    }
  } else {
    // 新列，升序
    sorting.value = [{ id, desc: false }]
  }
}

onMounted(() => {
  fetchSignals()
})

watch([page, sorting], () => {
  fetchSignals()
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <div class="flex items-center justify-between p-3">
      <h1 class="finance-title-lg">交易信号列表</h1>
      <div class="flex gap-4 items-center">
        <input
          v-model="stockCode"
          placeholder="输入股票代码筛选"
          class="finance-input w-64"
        />
        <button
          @click="handleSearch"
          class="finance-btn-primary"
        >
          搜索
        </button>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="w-1/4 overflow-auto p-3">
        <div v-if="!error" class="h-full">
          <div v-if="loading" class="flex items-center justify-center h-full" style="color: var(--text-muted);">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2" style="border-color: var(--accent-500);"></div>
          </div>
          <template v-else>
            <table class="finance-table">
              <thead>
                <tr>
                  <th>
                    <span @click="toggleSort('stockCode')" class="cursor-pointer select-none flex items-center transition-colors" style="color: var(--text-secondary);" @mouseover="$event.target.style.color = 'var(--accent-500)'" @mouseout="$event.target.style.color = 'var(--text-secondary)'">
                      股票
                      <span v-if="sorting[0]?.id === 'stockCode'" style="color: var(--accent-500);">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                  <th>
                    <span @click="toggleSort('signalTime')" class="cursor-pointer select-none flex items-center transition-colors" style="color: var(--text-secondary);" @mouseover="$event.target.style.color = 'var(--accent-500)'" @mouseout="$event.target.style.color = 'var(--text-secondary)'">
                      信号时间
                      <span v-if="sorting[0]?.id === 'signalTime'" style="color: var(--accent-500);">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                  <th>
                    <span @click="toggleSort('signalPrice')" class="cursor-pointer select-none flex items-center transition-colors" style="color: var(--text-secondary);" @mouseover="$event.target.style.color = 'var(--accent-500)'" @mouseout="$event.target.style.color = 'var(--text-secondary)'">
                      信号价格
                      <span v-if="sorting[0]?.id === 'signalPrice'" style="color: var(--accent-500);">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in signals" :key="row._id" :class="[selectedSignal && selectedSignal._id === row._id ? 'bg-blue-100' : 'cursor-pointer', 'transition']" @click="selectedSignal = row">
                  <td class="px-4 py-2">{{ row.stockCode }}</td>
                  <td class="px-4 py-2">{{ new Date(row.signalTime).toLocaleDateString() }}</td>
                  <td class="px-4 py-2">{{ row.signalPrice }}</td>
                </tr>
              </tbody>
            </table>
            <div class="sticky bottom-0 py-2 flex justify-end border-t px-4 bg-white">
              <UPagination
                v-model:page="page"
                :total="total"
                :page-size="pageSize"
                :page-count="Math.ceil(total / pageSize)"
              />
            </div>
          </template>
        </div>
        <div v-else class="p-4 bg-red-50">
          <div class="text-red-500">{{ error }}</div>
        </div>
      </div>

      <div class="w-3/4 overflow-auto">
        <SignalDetail 
          v-if="selectedSignal" 
          :signal="selectedSignal"
          class="h-full"
        />
        <div v-else class="h-full flex items-center justify-center text-gray-500 bg-gray-50">
          <div class="text-center space-y-4">
            <div class="text-5xl mb-2 animate-bounce">👈</div>
            <div class="text-xl">点击左侧列表查看详情</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-blue-100 {
  background-color: #dbeafe !important;
}
</style>