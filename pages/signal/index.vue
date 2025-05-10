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
    accessorKey: 'buyPrice', 
    header: ({ column }) => getHeader(column, '买入价格'),
    cell: ({ row }) => row.getValue('buyPrice')?.toFixed(2)
  },
  { 
    accessorKey: 'sellTime', 
    header: ({ column }) => getHeader(column, '卖出时间'),
    cell: ({ row }) => row.getValue('sellTime') ? new Date(row.getValue('sellTime')).toLocaleString() : '-'
  },
  { 
    accessorKey: 'sellPrice', 
    header: ({ column }) => getHeader(column, '卖出价格'),
    cell: ({ row }) => row.getValue('sellPrice')?.toFixed(2) || '-'
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

onMounted(() => {
  fetchSignals()
})

watch([page, sorting], () => {
  fetchSignals()
})
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">交易信号列表</h1>
    
    <UCard class="mb-4">
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
    </UCard>

    <UCard v-if="!error">
      <USkeleton v-if="loading" class="h-[300px]" />
      <template v-else>
        <UTable
          :data="signals"
          :columns="columns"
          v-model:sorting="sorting"
          hover
        />
        <div class="mt-4 flex justify-end">
          <UPagination
            v-model:page="page"
            :total="total"
            :page-size="pageSize"
            :page-count="Math.ceil(total / pageSize)"
          />
        </div>
      </template>
    </UCard>
    <UCard v-else class="p-4 bg-red-50">
      <div class="text-red-500">{{ error }}</div>
    </UCard>
  </div>
</template>