<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="mx-auto max-w-5xl space-y-4">
      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-2 text-sm font-medium text-gray-700">条件筛选（来自条件编辑器）</div>
        <div class="mb-3">
          <label class="mb-1 block text-xs font-medium text-gray-500">代码搜索（模糊匹配）</label>
          <input
            v-model.trim="searchKeyword"
            type="text"
            placeholder="输入股票代码，例如 600 或 sz.000"
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300"
          >
        </div>
        <label class="mb-3 flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700">
          <input
            v-model="trendUpChannelOnly"
            type="checkbox"
            class="h-4 w-4"
          >
          <span>仅看上升通道（月线DIF&gt;0 且 周线DIF&gt;DEA）</span>
        </label>
        <div class="mb-2 text-xs font-medium text-gray-500">MACD 条件标签（交集）</div>
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
          <label
            v-for="tag in macdConditionOptions"
            :key="tag.value"
            class="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
          >
            <input
              v-model="selectedConditionTags"
              type="checkbox"
              :value="tag.value"
              class="h-4 w-4"
            >
            <span>{{ tag.label }}</span>
          </label>
        </div>
        <div class="mb-2 mt-3 text-xs font-medium text-gray-500">BIAS 条件标签（交集）</div>
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
          <label
            v-for="tag in biasConditionOptions"
            :key="tag.value"
            class="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
          >
            <input
              v-model="selectedConditionTags"
              type="checkbox"
              :value="tag.value"
              class="h-4 w-4"
            >
            <span>{{ tag.label }}</span>
          </label>
        </div>
        <label class="mt-3 flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700">
          <input
            v-model="excludeST"
            type="checkbox"
            class="h-4 w-4"
          >
          <span>过滤ST股</span>
        </label>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <div class="text-sm font-medium text-gray-700">股票列表</div>
          <div class="flex items-center gap-2">
            <button
              class="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
              :disabled="loading || displayStocks.length === 0 || addingToWatchlist"
              @click="addAllToWatchlist"
            >
              {{ addingToWatchlist ? '添加中...' : '一键加入观察列表' }}
            </button>
            <button
              class="rounded bg-emerald-600 px-3 py-1.5 text-xs text-white hover:bg-emerald-700 disabled:opacity-50"
              :disabled="loading || nonStStocks.length === 0 || addingNonStToWatchlist"
              @click="addNonStToWatchlist"
            >
              {{ addingNonStToWatchlist ? '添加中...' : '一键添加非ST股' }}
            </button>
            <div class="text-xs text-gray-500">共 {{ displayStocks.length }} 只</div>
          </div>
        </div>
        <div v-if="loading" class="py-8 text-center text-sm text-gray-500">加载中...</div>
        <div v-else-if="error" class="py-8 text-center text-sm text-red-600">{{ error }}</div>
        <div v-else-if="displayStocks.length === 0" class="py-8 text-center text-sm text-gray-500">暂无匹配股票</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead>
              <tr class="bg-gray-50 text-left text-gray-600">
                <th class="border-b border-gray-200 px-3 py-2">代码</th>
                <th class="border-b border-gray-200 px-3 py-2">名称</th>
                <th class="border-b border-gray-200 px-3 py-2">上升通道</th>
                <th class="border-b border-gray-200 px-3 py-2">条件标签</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="stock in displayStocks"
                :key="stock.code"
                class="hover:bg-gray-50"
              >
                <td class="border-b border-gray-100 px-3 py-2 font-medium text-gray-800">{{ stock.code }}</td>
                <td class="border-b border-gray-100 px-3 py-2 text-gray-700">{{ stock.name }}</td>
                <td class="border-b border-gray-100 px-3 py-2">
                  <span
                    :class="stock.macdTrendUpChannel ? 'rounded bg-red-50 px-2 py-0.5 text-xs text-red-700' : 'rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600'"
                  >
                    {{ stock.macdTrendUpChannel ? '是' : '否' }}
                  </span>
                </td>
                <td class="border-b border-gray-100 px-3 py-2">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in stock.conditionDayTags || []"
                      :key="`${stock.code}-${tag}`"
                      class="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                    >
                      {{ formatConditionTag(tag) }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue'
import { availableConditions } from '~/utils/algorithmUtils.js'

const trendUpChannelOnly = ref(false)
const selectedConditionTags = ref([])
const searchKeyword = ref('')
const stocks = ref([])
const loading = ref(false)
const error = ref('')
const addingToWatchlist = ref(false)
const addingNonStToWatchlist = ref(false)
const excludeST = ref(false)
let searchTimer = null

const conditionTagOptions = availableConditions
  .filter(item => Array.isArray(item?.params) && (item.params.includes('macd') || item.params.includes('bias')))
  .map(item => ({ value: item.value, label: item.label, params: item.params || [] }))

const macdConditionOptions = conditionTagOptions.filter(item => item.params.includes('macd'))
const biasConditionOptions = conditionTagOptions.filter(item => item.params.includes('bias'))
const conditionLabelMap = new Map(conditionTagOptions.map(item => [item.value, item.label]))

function isSTStock(stock) {
  const name = String(stock?.name || '')
  return /(^|\s|\*)st/i.test(name)
}

const displayStocks = computed(() => {
  if (!excludeST.value) return stocks.value
  return stocks.value.filter(stock => !isSTStock(stock))
})

const nonStStocks = computed(() => {
  return stocks.value.filter(stock => !isSTStock(stock))
})

function formatConditionTag(tag) {
  return conditionLabelMap.get(tag) || tag
}

async function loadStocks() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams({
      page: '1',
      pageSize: '500',
      noCount: '1'
    })
    if (trendUpChannelOnly.value) {
      params.set('macdTrendUpChannel', '1')
    }
    if (selectedConditionTags.value.length > 0) {
      params.set('conditionDayTags', selectedConditionTags.value.join(','))
    }
    if (searchKeyword.value) {
      params.set('search', searchKeyword.value)
      params.set('searchField', 'code')
    }
    const data = await $fetch(`/api/stocks?${params.toString()}`)
    stocks.value = Array.isArray(data?.stocks) ? data.stocks : []
  } catch (err) {
    error.value = err?.message || '加载失败'
    stocks.value = []
  } finally {
    loading.value = false
  }
}

async function addAllToWatchlist() {
  if (displayStocks.value.length === 0) return
  addingToWatchlist.value = true
  try {
    const codes = displayStocks.value.map(item => item.code).filter(Boolean)
    const result = await $fetch('/api/stocks/watchlist', {
      method: 'POST',
      body: { action: 'add', codes }
    })
    if (!result?.success) {
      throw new Error(result?.message || '加入观察列表失败')
    }
    alert(`已加入观察列表：${codes.length} 只`)
  } catch (err) {
    alert(err?.message || '加入观察列表失败')
  } finally {
    addingToWatchlist.value = false
  }
}

async function addNonStToWatchlist() {
  if (nonStStocks.value.length === 0) return
  addingNonStToWatchlist.value = true
  try {
    const codes = nonStStocks.value.map(item => item.code).filter(Boolean)
    const result = await $fetch('/api/stocks/watchlist', {
      method: 'POST',
      body: { action: 'add', codes }
    })
    if (!result?.success) {
      throw new Error(result?.message || '添加非ST股失败')
    }
    alert(`已加入非ST股票：${codes.length} 只`)
  } catch (err) {
    alert(err?.message || '添加非ST股失败')
  } finally {
    addingNonStToWatchlist.value = false
  }
}

watch([trendUpChannelOnly, selectedConditionTags], () => {
  loadStocks()
}, { deep: true })

watch(searchKeyword, () => {
  if (searchTimer) {
    clearTimeout(searchTimer)
  }
  searchTimer = setTimeout(() => {
    loadStocks()
  }, 300)
})

onMounted(() => {
  loadStocks()
})
</script>
