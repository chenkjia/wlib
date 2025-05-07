<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const stocks = ref([])
const error = ref('')
const loading = ref(true)

const columns = [
  { accessorKey: 'code', header: '代码' },
  { accessorKey: 'name', header: '名称' },
  {
    accessorKey: 'actions',
    header: '操作',
    cell: ({row}) => {
      return h('button', {
        class: 'px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600',
        onClick: () => router.push(`/stock/${row.original.code}`)
      }, '详情')
    }
  }
]

async function fetchStocks() {
  loading.value = true
  try {
    const response = await fetch('/api/stocks')
    const data = await response.json()
    stocks.value = data.map(stock => ({
      code: stock.code,
      name: stock.name
    }))
  } catch (err) {
    console.error('获取股票列表失败:', err)
    error.value = err.message || '获取股票列表失败'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchStocks()
})
</script>

<template>
  <div class="p-4">
    <h1 class="text-2xl font-bold mb-4">股票列表</h1>
    <UCard v-if="!error">
      <USkeleton v-if="loading" class="h-[300px]" />
      <UTable v-else :data="stocks" :columns="columns" hover />
    </UCard>
    <UCard v-else class="p-4 bg-red-50">
      <div class="text-red-500">{{ error }}</div>
    </UCard>
  </div>
</template>

<style>
</style>