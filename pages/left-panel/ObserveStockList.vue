<template>
  <div class="h-full flex flex-col">
    <div class="p-3 flex gap-2 border-b border-gray-200">
      <button class="finance-btn-primary px-3 py-2 text-sm" :disabled="loading" @click="fetchWatchlist">刷新</button>
      <button class="finance-btn-secondary px-3 py-2 text-sm" :disabled="loading || stocks.length === 0" @click="clearWatchlist">一键清空</button>
      <div class="ml-auto text-xs text-gray-500 self-center">共 {{ stocks.length }} 只</div>
    </div>

    <div v-if="loading" class="py-6 text-center text-sm text-gray-500">加载中...</div>
    <div v-else-if="error" class="py-6 text-center text-sm text-red-500">{{ error }}</div>
    <div v-else class="flex-1 overflow-auto p-2">
      <UTable
        :data="stocks"
        :columns="columns"
        class="w-full"
        :ui="{
          wrapper: 'border border-gray-200 rounded-lg overflow-hidden',
          td: {
            base: 'p-2 border-b border-gray-100 text-sm',
            padding: 'px-3 py-2'
          },
          th: {
            base: 'text-left p-2 border-b border-gray-200 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-200',
            padding: 'px-3 py-2'
          }
        }"
      >
        <template #code-cell="{ row }">
          <div
            class="font-medium cursor-pointer hover:text-blue-600"
            :class="{ 'text-blue-600 font-bold': selectedStockCode === row.original.code }"
            @click="selectedStockCode = row.original.code"
          >
            {{ row.original.code }}
          </div>
        </template>

        <template #name-cell="{ row }">
          <div
            class="truncate cursor-pointer hover:text-blue-600"
            :class="{ 'text-blue-600 font-bold': selectedStockCode === row.original.code }"
            @click="selectedStockCode = row.original.code"
          >
            {{ row.original.name }}
          </div>
        </template>

        <template #star-cell="{ row }">
          <div class="text-center" @click.stop="toggleStarStock(row.original.code)">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mx-auto transition-colors cursor-pointer hover:scale-110"
              :fill="starredStocks.includes(row.original.code) ? 'currentColor' : 'none'"
              viewBox="0 0 24 24"
              stroke="currentColor"
              :stroke-width="starredStocks.includes(row.original.code) ? 0 : 1.5"
              :class="starredStocks.includes(row.original.code) ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
        </template>

        <template #star-header>
          <div class="text-center">星标</div>
        </template>

        <template #empty-state>
          <div class="py-4 text-center text-gray-500">
            <p>观察列表为空</p>
          </div>
        </template>
      </UTable>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'

const selectedStockCode = defineModel('selectedStockCode', { type: String, default: '' })

const stocks = ref([])
const starredStocks = ref([])
const loading = ref(false)
const error = ref('')
const columns = ref([
  { accessorKey: 'code', header: '代码', id: 'code' },
  { accessorKey: 'name', header: '名称', id: 'name', size: 100 },
  { accessorKey: 'star', header: '星标', id: 'star' }
])

async function fetchWatchlist() {
  loading.value = true
  error.value = ''
  try {
    const response = await fetch('/api/stocks?page=1&pageSize=5000&noCount=1&focusFilter=focused&sortField=code&sortOrder=asc')
    const data = await response.json()
    stocks.value = Array.isArray(data?.stocks) ? data.stocks : []
    starredStocks.value = stocks.value.filter(item => item?.isStar).map(item => item.code)
  } catch (err) {
    error.value = err?.message || '加载观察列表失败'
    stocks.value = []
  } finally {
    loading.value = false
  }
}

async function clearWatchlist() {
  if (!confirm('确认清空观察列表吗？')) return
  try {
    const response = await fetch('/api/stocks/watchlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'clear' })
    })
    const result = await response.json()
    if (!result?.success) {
      alert(result?.message || '清空失败')
      return
    }
    stocks.value = []
  } catch (err) {
    alert(err?.message || '清空失败')
  }
}

async function toggleStarStock(code) {
  try {
    const isStar = !starredStocks.value.includes(code)
    const response = await fetch('/api/stocks/star', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, isStar })
    })
    const result = await response.json()
    if (!result?.success) {
      alert(result?.message || '更新星标失败')
      return
    }
    const idx = starredStocks.value.indexOf(code)
    if (idx === -1) {
      starredStocks.value.push(code)
    } else {
      starredStocks.value.splice(idx, 1)
    }
    const stock = stocks.value.find(item => item.code === code)
    if (stock) stock.isStar = isStar
  } catch (err) {
    alert(err?.message || '更新星标失败')
  }
}

onMounted(() => {
  fetchWatchlist()
})

defineExpose({
  fetchWatchlist
})
</script>
