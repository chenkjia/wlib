<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="mx-auto max-w-5xl space-y-4">
      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-2 text-sm font-medium text-gray-700">MACD筛选</div>
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
        <div class="mb-2 text-xs font-medium text-gray-500">日线标签（交集）</div>
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
          <label
            v-for="tag in macdDayTagOptions"
            :key="tag.value"
            class="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
          >
            <input
              v-model="selectedDayTags"
              type="checkbox"
              :value="tag.value"
              class="h-4 w-4"
            >
            <span>{{ tag.label }}</span>
          </label>
        </div>
        <div class="mb-2 mt-3 text-xs font-medium text-gray-500">小时线标签（交集）</div>
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2">
          <label
            v-for="tag in macdHourTagOptions"
            :key="tag.value"
            class="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-700"
          >
            <input
              v-model="selectedHourTags"
              type="checkbox"
              :value="tag.value"
              class="h-4 w-4"
            >
            <span>{{ tag.label }}</span>
          </label>
        </div>
      </div>

      <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div class="mb-3 flex items-center justify-between">
          <div class="text-sm font-medium text-gray-700">股票列表</div>
          <div class="flex items-center gap-2">
            <button
              class="rounded bg-blue-600 px-3 py-1.5 text-xs text-white hover:bg-blue-700 disabled:opacity-50"
              :disabled="loading || stocks.length === 0 || addingToWatchlist"
              @click="addAllToWatchlist"
            >
              {{ addingToWatchlist ? '添加中...' : '一键加入观察列表' }}
            </button>
            <div class="text-xs text-gray-500">共 {{ stocks.length }} 只</div>
          </div>
        </div>
        <div v-if="loading" class="py-8 text-center text-sm text-gray-500">加载中...</div>
        <div v-else-if="error" class="py-8 text-center text-sm text-red-600">{{ error }}</div>
        <div v-else-if="stocks.length === 0" class="py-8 text-center text-sm text-gray-500">暂无匹配股票</div>
        <div v-else class="overflow-x-auto">
          <table class="min-w-full border-collapse text-sm">
            <thead>
              <tr class="bg-gray-50 text-left text-gray-600">
                <th class="border-b border-gray-200 px-3 py-2">代码</th>
                <th class="border-b border-gray-200 px-3 py-2">名称</th>
                <th class="border-b border-gray-200 px-3 py-2">上升通道</th>
                <th class="border-b border-gray-200 px-3 py-2">日线标签</th>
                <th class="border-b border-gray-200 px-3 py-2">小时线标签</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="stock in stocks"
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
                      v-for="tag in stock.macdDayTags || []"
                      :key="`${stock.code}-${tag}`"
                      class="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                    >
                      {{ formatDayTag(tag) }}
                    </span>
                  </div>
                </td>
                <td class="border-b border-gray-100 px-3 py-2">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="tag in stock.macdHourTags || []"
                      :key="`${stock.code}-${tag}`"
                      class="rounded bg-purple-50 px-2 py-0.5 text-xs text-purple-700"
                    >
                      {{ formatHourTag(tag) }}
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
import { ref, watch, onMounted } from 'vue'

const macdDayTagOptions = [
  { value: 'macd_day_bar_green_to_red', label: '日线绿柱转红柱' },
  { value: 'macd_day_red_bar_growing', label: '日线红柱增大' },
  { value: 'macd_day_dif_above_zero_low_zone', label: '日线 DIF 0轴上方低位' },
  { value: 'macd_day_prev_bar_less_than_prev2', label: '日线前一天柱线小于前前一天' },
  { value: 'macd_day_close_above_ma60', label: '日线收盘价高于 MA60' },
  { value: 'macd_day_ma60_up', label: '日线 MA60 高于前一日' },
  { value: 'macd_day_close_above_ma20', label: '日线收盘价高于 MA20' },
  { value: 'macd_day_ma20_up', label: '日线 MA20 高于前一日' },
  { value: 'macd_day_ma20_above_ma60', label: '日线 MA20 大于 MA60' },
  { value: 'macd_day_oversold_signal_in_5d', label: '5天内出现超跌信号' },
  { value: 'macd_day_drop_50_in_10d', label: '10个交易日内跌幅≥50%' }
]

const macdHourTagOptions = [
  { value: 'macd_hour_second_golden_cross_below_zero', label: '小时线 0轴下二次金叉' }
]

const trendUpChannelOnly = ref(false)
const selectedDayTags = ref([])
const selectedHourTags = ref([])
const searchKeyword = ref('')
const stocks = ref([])
const loading = ref(false)
const error = ref('')
const addingToWatchlist = ref(false)
let searchTimer = null

function formatDayTag(tag) {
  const match = macdDayTagOptions.find(item => item.value === tag)
  return match ? match.label : tag
}

function formatHourTag(tag) {
  const match = macdHourTagOptions.find(item => item.value === tag)
  return match ? match.label : tag
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
    if (selectedDayTags.value.length > 0) {
      params.set('macdDayTags', selectedDayTags.value.join(','))
    }
    if (selectedHourTags.value.length > 0) {
      params.set('macdHourTags', selectedHourTags.value.join(','))
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
  if (stocks.value.length === 0) return
  addingToWatchlist.value = true
  try {
    const codes = stocks.value.map(item => item.code).filter(Boolean)
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

watch([trendUpChannelOnly, selectedDayTags, selectedHourTags], () => {
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
