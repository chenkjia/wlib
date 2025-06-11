<script setup>
import { ref, onMounted, watch } from 'vue'
import { h } from 'vue'
import TransactionDetail from './components/TransactionDetail.vue'
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
const transactions = ref([])
const error = ref('')
const loading = ref(true)
const total = ref(0)
const page = ref(1)
const pageSize = ref(18)
const stockCode = ref('')
const selectedTransaction = ref(null)

const sorting = ref([{
  id: 'buyTime',
  desc: true
}])

const columns = [
  { 
    accessorKey: 'stockCode', 
    header: ({ column }) => getHeader(column, '股票')
  },
  { 
    accessorKey: 'buyTime', 
    header: ({ column }) => getHeader(column, '买入时间'),
    cell: ({ row }) => new Date(row.getValue('buyTime')).toLocaleDateString()
  },
  { 
    accessorKey: 'buyPrice', 
    header: ({ column }) => getHeader(column, '买入价格')
  },
  { 
    accessorKey: 'sellTime', 
    header: ({ column }) => getHeader(column, '卖出时间'),
    cell: ({ row }) => row.getValue('sellTime') ? new Date(row.getValue('sellTime')).toLocaleDateString() : '-'
  },
  { 
    accessorKey: 'sellPrice', 
    header: ({ column }) => getHeader(column, '卖出价格')
  },
  { 
    accessorKey: 'profit', 
    header: ({ column }) => getHeader(column, '盈亏'),
    cell: ({ row }) => {
      const profit = row.getValue('profit')
      return profit !== null && profit !== undefined 
        ? `${profit > 0 ? '+' : ''}${profit.toFixed(2)}%` 
        : '-'
    }
  }
]

async function fetchTransactions() {
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
    const response = await fetch(`/api/transactions?${params}`)
    const data = await response.json()
    transactions.value = data.data
    total.value = data.total
  } catch (err) {
    console.error('获取交易记录列表失败:', err)
    error.value = err.message || '获取交易记录列表失败'
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchTransactions()
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
    // 新列，降序（交易默认按时间降序）
    sorting.value = [{ id, desc: true }]
  }
}

onMounted(() => {
  fetchTransactions()
})

watch([page, sorting], () => {
  fetchTransactions()
})
</script>

<template>
  <div class="h-screen flex flex-col overflow-hidden">
    <div class="flex items-center justify-between px-6 py-3 border-b bg-white">
      <h1 class="text-2xl font-bold">交易记录列表</h1>
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
      <div class="w-1/3 border-r overflow-auto">
        <div v-if="!error" class="h-full">
          <USkeleton v-if="loading" class="h-full" />
          <template v-else>
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th class="px-4 py-2">
                    <span @click="toggleSort('stockCode')" class="cursor-pointer select-none flex items-center">
                      股票
                      <span v-if="sorting[0]?.id === 'stockCode'">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                  <th class="px-4 py-2">
                    <span @click="toggleSort('buyTime')" class="cursor-pointer select-none flex items-center">
                      买入时间
                      <span v-if="sorting[0]?.id === 'buyTime'">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                  <th class="px-4 py-2">
                    <span @click="toggleSort('buyPrice')" class="cursor-pointer select-none flex items-center">
                      买入价格
                      <span v-if="sorting[0]?.id === 'buyPrice'">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                  <th class="px-4 py-2">
                    <span @click="toggleSort('profit')" class="cursor-pointer select-none flex items-center">
                      盈亏
                      <span v-if="sorting[0]?.id === 'profit'">
                        <span v-if="!sorting[0].desc">▲</span>
                        <span v-else>▼</span>
                      </span>
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in transactions" :key="row._id" :class="[selectedTransaction && selectedTransaction._id === row._id ? 'bg-blue-100' : 'cursor-pointer', 'transition']" @click="selectedTransaction = row">
                  <td class="px-4 py-2">{{ row.stockCode }}</td>
                  <td class="px-4 py-2">{{ new Date(row.buyTime).toLocaleDateString() }}</td>
                  <td class="px-4 py-2">{{ row.buyPrice }}</td>
                  <td class="px-4 py-2" :class="row.profit > 0 ? 'text-green-600' : row.profit < 0 ? 'text-red-600' : ''">
                    {{ row.profit !== null && row.profit !== undefined ? `${row.profit > 0 ? '+' : ''}${row.profit.toFixed(2)}%` : '-' }}
                  </td>
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

      <div class="w-2/3 overflow-auto">
        <TransactionDetail 
          v-if="selectedTransaction" 
          :transaction="selectedTransaction"
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