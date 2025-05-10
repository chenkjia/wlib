<script setup>
import { ref, onMounted, watch } from 'vue'
import { h } from 'vue'
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
const pageSize = ref(10)
const stockCode = ref('')
const selectedSignal = ref(null)

const sorting = ref([{
  id: 'buyTime',
  desc: false
}])

const columns = [
  { 
    accessorKey: 'stockCode', 
    header: ({ column }) => getHeader(column, '股票代码')
  },
  { 
    accessorKey: 'buyTime', 
    header: ({ column }) => getHeader(column, '买入时间'),
    cell: ({ row }) => new Date(row.getValue('buyTime')).toLocaleString()
  },
  { 
    accessorKey: 'profit', 
    header: ({ column }) => getHeader(column, '盈利'),
    cell: ({ row }) => {
      const profit = row.getValue('profit')
      if (profit === undefined || profit === null) return '-'
      return h('span', {
        class: profit >= 0 ? 'text-green-500' : 'text-red-500'
      }, `${profit.toFixed(2)}%`)
    }
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

function handleRowClick(row) {
    console.log('row', row)
  selectedSignal.value = row.original
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
    <div class="flex items-center justify-between px-6 py-3 border-b bg-white">
      <h1 class="text-2xl font-bold">交易信号列表</h1>
      <div class="flex gap-4 items-center">
        <UInput
          v-model="stockCode"
          placeholder="输入股票代码筛选"
          class="w-64"
        />
        <UButton
          color="primary"
          @click="handleSearch"
        >
          搜索
        </UButton>
      </div>
    </div>

    <div class="flex-1 flex overflow-hidden">
      <div class="w-1/4 border-r overflow-auto">
        <div v-if="!error" class="h-full">
          <USkeleton v-if="loading" class="h-full" />
          <template v-else>
            <UTable
              :data="signals"
              :columns="columns"
              v-model:sorting="sorting"
              hover
              @row-click="handleRowClick"
              :selected="selectedSignal ? [selectedSignal] : []"
              class="min-h-full"
            />
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

      <div class="w-3/5 overflow-auto">
        <div v-if="selectedSignal" class="min-h-full p-8">
          <div class="max-w-3xl mx-auto space-y-8">
            <div class="flex items-center justify-between border-b pb-4">
              <h2 class="text-2xl font-semibold">交易信号详情</h2>
              <div class="text-lg font-medium" :class="selectedSignal.profit >= 0 ? 'text-green-500' : 'text-red-500'">
                盈亏：{{ selectedSignal.profit?.toFixed(2) }}%
              </div>
            </div>
            <div class="grid grid-cols-2 gap-8">
              <div class="p-6 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div class="text-sm text-gray-500 mb-2">股票代码</div>
                <div class="text-xl font-medium">{{ selectedSignal.stockCode }}</div>
              </div>
              <div class="p-6 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div class="text-sm text-gray-500 mb-2">买入时间</div>
                <div class="text-xl font-medium">{{ new Date(selectedSignal.buyTime).toLocaleString() }}</div>
              </div>
              <div class="p-6 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div class="text-sm text-gray-500 mb-2">买入价格</div>
                <div class="text-xl font-medium">{{ selectedSignal.buyPrice?.toFixed(2) }}</div>
              </div>
              <div class="p-6 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div class="text-sm text-gray-500 mb-2">卖出时间</div>
                <div class="text-xl font-medium">{{ selectedSignal.sellTime ? new Date(selectedSignal.sellTime).toLocaleString() : '-' }}</div>
              </div>
              <div class="p-6 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div class="text-sm text-gray-500 mb-2">卖出价格</div>
                <div class="text-xl font-medium">{{ selectedSignal.sellPrice?.toFixed(2) || '-' }}</div>
              </div>
            </div>
          </div>
        </div>
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