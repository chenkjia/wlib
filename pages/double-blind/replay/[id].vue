<template>
  <div class="h-screen w-full bg-gray-100 p-3">
    <div class="h-full flex flex-col gap-3">
      <div class="rounded-lg border border-gray-200 bg-white p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm text-gray-700">
            <span class="font-semibold">训练复盘</span>
            <span v-if="record" class="ml-2">{{ record.stockName }} ({{ record.stockCode }})</span>
          </div>
          <button class="px-3 py-1.5 rounded-md bg-slate-600 text-white text-sm hover:bg-slate-700" @click="navigateTo('/double-blind')">
            返回开始页
          </button>
        </div>
        <div v-if="record" class="mt-2 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
          <span>训练时间：{{ record.trainingTimeText || '-' }}</span>
          <span>持仓时长：{{ record.holdingDurationText || '-' }}</span>
          <span>区间：{{ record.timeRange }}</span>
          <span>盈亏：{{ formatNumber(record.profit) }}</span>
        </div>
      </div>

      <div v-if="record" class="grid grid-cols-1 xl:grid-cols-4 gap-3 min-h-0 flex-1">
        <div class="xl:col-span-3 rounded-lg border border-gray-200 bg-white p-2 min-h-0">
          <BlindKChart
            :lineWithMetric="replayLineWithMetric"
            :transactions="replayTransactions"
            :enabledIndicators="record.snapshot.enabledIndicators"
            :ma="record.snapshot.ma"
            :markers="replayMarkers"
            :initialFocusRange="replayFocusRange"
            :useRealDate="true"
          />
        </div>
        <div class="rounded-lg border border-gray-200 bg-white p-2 flex flex-col min-h-0">
          <div class="px-2 pb-2 text-xs text-gray-500">操作明细</div>
          <div class="px-2 flex-1 min-h-0 overflow-auto">
            <table class="w-full text-xs">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-2 py-1 text-left">买入价格</th>
                  <th class="px-2 py-1 text-left">卖出价格</th>
                  <th class="px-2 py-1 text-left">股数</th>
                  <th class="px-2 py-1 text-left">盈亏</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in replayActionLogs" :key="item.id" class="border-b border-gray-100">
                  <td class="px-2 py-1">{{ formatNumber(item.buyPrice) }}</td>
                  <td class="px-2 py-1">{{ formatNumber(item.sellPrice) }}</td>
                  <td class="px-2 py-1">{{ formatNumber(item.shares) }}</td>
                  <td class="px-2 py-1" :class="Number(item.pnl) >= 0 ? 'text-red-600' : 'text-green-600'">{{ formatNumber(item.pnl) }}</td>
                </tr>
                <tr v-if="replayActionLogs.length === 0">
                  <td class="px-2 py-2 text-gray-400" colspan="4">暂无操作记录</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div v-else class="rounded-lg border border-gray-200 bg-white p-6 text-sm text-gray-500">
        未找到该复盘记录，可能已被清理。
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import BlindKChart from '~/components/BlindKChart.vue'
import { calculateMetric } from '~/utils/chartUtils.js'

const RECORD_KEY = 'double_blind_records_v1'
const route = useRoute()
const record = ref(null)

function formatNumber(value) {
  const n = Number(value) || 0
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function buildAdjustedLine(rawLine = []) {
  if (!Array.isArray(rawLine) || rawLine.length === 0) return []
  const anchorFactor = Number(rawLine[rawLine.length - 1]?.foreAdjustFactor) || 1
  return rawLine.map(item => {
    const factor = Number(item.foreAdjustFactor) || anchorFactor
    const ratio = factor / anchorFactor
    return {
      ...item,
      open: Number(item.open) * ratio,
      high: Number(item.high) * ratio,
      low: Number(item.low) * ratio,
      close: Number(item.close) * ratio
    }
  })
}

function toForwardAdjustedPrice(price, factor, anchorFactor) {
  const p = Number(price)
  const f = Number(factor)
  const anchor = Number(anchorFactor)
  if (!Number.isFinite(p) || !Number.isFinite(f) || !Number.isFinite(anchor) || f <= 0 || anchor <= 0) return Number(price) || 0
  return p * (f / anchor)
}

const replayLineWithMetric = computed(() => {
  if (!record.value) return { line: [] }
  const fullLine = [
    ...(record.value.snapshot.line || []),
    ...(record.value.snapshot.afterTestLine || [])
  ]
  const adjustedLine = buildAdjustedLine(fullLine)
  return calculateMetric(adjustedLine, {
    ma: record.value.snapshot.ma,
    macd: record.value.snapshot.macd,
    kdj: record.value.snapshot.kdj,
    bias: record.value.snapshot.bias,
    volumeMa: record.value.snapshot.volumeMa,
    enabledIndicators: record.value.snapshot.enabledIndicators
  })
})

const replayTransactions = computed(() => {
  if (!record.value) return []
  const line = record.value.snapshot.line || []
  const anchorFactor = Number(line[line.length - 1]?.foreAdjustFactor) || 1
  return (record.value.snapshot.closedTrades || []).map(item => ({
    buyTime: item.buyTime,
    buyPrice: toForwardAdjustedPrice(item.buyPrice, item.buyFactor || anchorFactor, anchorFactor),
    sellTime: item.sellTime,
    sellPrice: toForwardAdjustedPrice(item.sellPrice, item.sellFactor || anchorFactor, anchorFactor)
  }))
})

const replayMarkers = computed(() => {
  if (!record.value) return {}
  const line = record.value.snapshot.line || []
  if (line.length === 0) return {}
  const historyBars = 300
  const testBars = 300
  const startLine = line[historyBars]
  const endLine = line[historyBars + testBars - 1] || line[line.length - 1]
  const currentPrice = Number(replayLineWithMetric.value?.line?.[replayLineWithMetric.value.line.length - 1]?.close)
  return {
    startTime: startLine?.time || null,
    startIndex: historyBars,
    endTime: endLine?.time || null,
    endIndex: historyBars + testBars,
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : null,
    positionPrice: null
  }
})

const replayFocusRange = computed(() => {
  if (!record.value) return null
  const historyBars = 300
  const testBars = 300
  return {
    startIndex: historyBars,
    endIndex: historyBars + testBars - 1
  }
})

const replayActionLogs = computed(() => {
  const snapshot = record.value?.snapshot || {}
  const logs = Array.isArray(snapshot.actionLogs) ? snapshot.actionLogs : []
  if (logs.length > 0) {
    return logs
  }
  const closedTrades = Array.isArray(snapshot.closedTrades) ? snapshot.closedTrades : []
  return closedTrades.map((trade, index) => ({
    id: `fallback-${index}`,
    buyPrice: Number(trade?.buyPrice) || 0,
    sellPrice: Number(trade?.sellPrice) || 0,
    shares: Number(trade?.shares) || 0,
    pnl: Number(trade?.pnl) || 0
  }))
})

function loadRecord() {
  if (!process.client) return
  try {
    const raw = localStorage.getItem(RECORD_KEY)
    const list = raw ? JSON.parse(raw) : []
    const id = String(route.params.id || '')
    record.value = list.find(item => String(item.id) === id) || null
  } catch {
    record.value = null
  }
}

onMounted(() => {
  loadRecord()
})
</script>
