<template>
  <div class="h-screen w-full bg-gray-100 p-3">
    <div v-if="!session" class="h-full flex flex-col gap-3">
      <div class="rounded-lg border border-gray-200 bg-white p-4">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div class="text-base font-semibold text-gray-800">股票双盲训练</div>
            <div class="text-xs text-gray-500 mt-1">从这里开始新测试，历史测试记录也在这里查看与复盘。</div>
          </div>
          <button
            class="px-3 py-1.5 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
            :disabled="loading"
            @click="startRandomSession"
          >
            {{ loading ? '抽样中...' : '开始随机测试' }}
          </button>
        </div>
        <div v-if="errorMessage" class="mt-2 text-xs text-red-600">{{ errorMessage }}</div>
      </div>

      <div class="min-h-0 flex-1 flex flex-col gap-3">
        <div class="min-h-0 flex flex-col gap-3">
          <div class="rounded-lg border border-gray-200 bg-white p-3">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-gray-700">测试记录</div>
            </div>
            <div class="mt-2 max-h-[380px] overflow-auto">
              <table class="w-full text-xs">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-2 py-1 text-left">股票</th>
                    <th class="px-2 py-1 text-left">时间</th>
                    <th class="px-2 py-1 text-left">平均持仓率</th>
                    <th class="px-2 py-1 text-left">开仓胜率</th>
                    <th class="px-2 py-1 text-left">区间涨跌幅</th>
                    <th class="px-2 py-1 text-left">盈亏</th>
                    <th class="px-2 py-1 text-left">最大回撤</th>
                    <th class="px-2 py-1 text-left">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="record in records" :key="record.id" class="border-b border-gray-100">
                    <td class="px-2 py-1">{{ record.stockName }} ({{ record.stockCode }})</td>
                    <td class="px-2 py-1">{{ record.timeRange }}</td>
                    <td class="px-2 py-1">{{ formatPercent(record.avgHoldingRate) }}</td>
                    <td class="px-2 py-1">{{ formatPercent(record.winRate) }}</td>
                    <td class="px-2 py-1">{{ formatPercent(record.intervalReturn) }}</td>
                    <td class="px-2 py-1" :class="record.profit >= 0 ? 'text-red-600' : 'text-green-600'">{{ formatNumber(record.profit) }}</td>
                    <td class="px-2 py-1">{{ formatPercent(record.maxDrawdown) }}</td>
                    <td class="px-2 py-1">
                      <button class="px-2 py-0.5 rounded bg-indigo-600 text-white" @click="openReplay(record)">复盘</button>
                    </td>
                  </tr>
                  <tr v-if="records.length === 0">
                    <td class="px-2 py-2 text-gray-400" colspan="8">暂无测试记录</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="replayRecord" class="rounded-lg border border-indigo-200 bg-indigo-50 p-3 min-h-0 flex-1">
            <div class="flex items-center justify-between">
              <div class="text-sm font-medium text-indigo-800">
                复盘：{{ replayRecord.stockName }} ({{ replayRecord.stockCode }})
              </div>
              <button class="px-2 py-1 rounded bg-indigo-600 text-white text-xs" @click="replayRecord = null">关闭</button>
            </div>
            <div class="mt-2 h-full min-h-[380px]">
              <BlindKChart
                :lineWithMetric="replayLineWithMetric"
                :transactions="replayTransactions"
                :enabledIndicators="replayRecord.snapshot.enabledIndicators"
                :ma="replayRecord.snapshot.ma"
                :markers="replayMarkers"
              />
            </div>
          </div>
        </div>

      </div>
    </div>

    <div v-else class="h-full flex flex-col gap-3">
      <div class="rounded-lg border border-gray-200 bg-white p-3">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="text-sm text-gray-700 font-semibold">股票双盲训练</div>
          <div class="flex flex-wrap gap-2">
            <button
              class="px-3 py-1.5 rounded-md bg-slate-600 text-white text-sm hover:bg-slate-700"
              @click="backToStartPage"
            >
              返回开始页
            </button>
            <button
              class="px-3 py-1.5 rounded-md bg-slate-700 text-white text-sm hover:bg-slate-800 disabled:opacity-50"
              :disabled="session.status === 'finished'"
              @click="finishSession('manual')"
            >
              结束并结算
            </button>
          </div>
        </div>

        <div class="mt-2 text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1">
          <span>进度：{{ session.revealedSteps }} / {{ session.testBars }}</span>
          <span>显示K线：{{ visibleRawLine.length }}</span>
          <span>状态：{{ session.status === 'finished' ? '已结束' : '进行中' }}</span>
          <span>现金：{{ formatNumber(session.cash || 0) }}</span>
          <span>持仓股数：{{ formatNumber(session.shares || 0) }}</span>
          <span>总资产：{{ formatNumber(currentTotalAsset) }}</span>
          <span>最大回撤：{{ formatPercent(session.maxDrawdown || 0) }}</span>
        </div>
      </div>

      <div class="grid grid-cols-1 xl:grid-cols-4 gap-3 min-h-0 flex-1">
        <div class="xl:col-span-3 min-h-0 flex flex-col gap-3">
          <div class="rounded-lg border border-gray-200 bg-white p-2 min-h-0 flex-1">
            <BlindKChart
              :lineWithMetric="visibleLineWithMetric"
              :transactions="chartTransactions"
              :enabledIndicators="enabledIndicators"
              :ma="ma"
              :markers="blindMarkers"
            />
          </div>

          <div class="rounded-lg border border-gray-200 bg-white p-3">
            <div class="text-sm font-medium text-gray-700 mb-2">操作按钮</div>
            <div class="flex flex-wrap gap-2">
              <button
                class="px-3 py-1.5 rounded-md bg-gray-700 text-white text-sm hover:bg-gray-800 disabled:opacity-50"
                :disabled="!canOperate"
                @click="handleAction('observe')"
              >
                观察
              </button>
              <button
                class="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-50"
                :disabled="!canOperate"
                @click="handleAction('buy')"
              >
                买入（全仓）
              </button>
              <button
                class="px-3 py-1.5 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
                :disabled="!canOperate"
                @click="handleAction('sell')"
              >
                卖出（平仓）
              </button>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-2 flex flex-col min-h-0">
          <div class="flex-1 min-h-0 overflow-auto">
            <div class="px-2 pb-1 text-sm font-medium text-gray-700">指标配置</div>
            <ConfigRules
              :ma="ma"
              :macd="macd"
              :kdj="kdj"
              :volumeMa="volumeMa"
              :bias="bias"
              :enabledIndicators="enabledIndicators"
              :buyConditions="[]"
              :sellConditions="[]"
              :showAlgorithmEditors="false"
              :showCalculationActions="false"
              @update:ma="(v) => ma = v"
              @update:macd="(v) => macd = v"
              @update:kdj="(v) => kdj = v"
              @update:volumeMa="(v) => volumeMa = v"
              @update:bias="(v) => bias = v"
              @update:enabledIndicators="(v) => enabledIndicators = normalizeEnabledIndicators(v)"
            />
          </div>
          <div class="mt-3 border-t border-gray-200 pt-3">
            <div class="px-2 pb-2 text-xs text-gray-500">操作明细</div>
            <div class="px-2 max-h-48 overflow-auto">
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
                  <tr v-for="item in visibleActionLogs" :key="item.id" class="border-b border-gray-100">
                    <td class="px-2 py-1">{{ formatNumber(item.buyPrice) }}</td>
                    <td class="px-2 py-1">{{ formatNumber(item.sellPrice) }}</td>
                    <td class="px-2 py-1">{{ formatNumber(item.shares) }}</td>
                    <td class="px-2 py-1" :class="Number(item.pnl) >= 0 ? 'text-red-600' : 'text-green-600'">{{ formatNumber(item.pnl) }}</td>
                  </tr>
                  <tr v-if="visibleActionLogs.length === 0">
                    <td class="px-2 py-2 text-gray-400" colspan="4">暂无操作记录</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import BlindKChart from '~/components/BlindKChart.vue'
import ConfigRules from '~/pages/right-panel/ConfigRules.vue'
import { calculateMetric } from '~/utils/chartUtils.js'

const INITIAL_CAPITAL = 100000
const FEE_RATE = 0.003
const RECORD_KEY = 'double_blind_records_v1'

const ma = ref(loadConfig('ma', { s: 24, m: 60, l: 120, x: 250 }))
const macd = ref(loadConfig('macd', { s: 12, l: 26, d: 9 }))
const kdj = ref(loadConfig('kdj', { n: 9, k: 3, d: 3 }))
const volumeMa = ref(normalizeVolumeMa(loadConfig('volumeMa', { s: 5, l: 10 })))
const bias = ref(loadConfig('bias', { s: 6, m: 12, l: 24 }))
const enabledIndicators = ref(normalizeEnabledIndicators(loadConfig('enabledIndicators', ['ma', 'macd', 'kdj', 'bias'])))

const loading = ref(false)
const errorMessage = ref('')
const session = ref(null)
const records = ref([])
const replayRecord = ref(null)

function loadConfig(key, fallback) {
  if (!process.client) return fallback
  try {
    const value = localStorage.getItem(`stock_config_${key}`)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function normalizeEnabledIndicators(value) {
  const arr = Array.isArray(value) ? value : ['ma', 'macd']
  return [...new Set(arr)]
}

function normalizeVolumeMa(value) {
  const s = Math.max(2, Number(value?.s) || 5)
  const l = Math.max(s, Number(value?.l) || 10)
  return { s, l }
}

function saveIndicatorConfig() {
  if (!process.client) return
  localStorage.setItem('stock_config_ma', JSON.stringify(ma.value))
  localStorage.setItem('stock_config_macd', JSON.stringify(macd.value))
  localStorage.setItem('stock_config_kdj', JSON.stringify(kdj.value))
  localStorage.setItem('stock_config_volumeMa', JSON.stringify(volumeMa.value))
  localStorage.setItem('stock_config_bias', JSON.stringify(bias.value))
  localStorage.setItem('stock_config_enabledIndicators', JSON.stringify(enabledIndicators.value))
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

function formatNumber(value) {
  const n = Number(value) || 0
  return n.toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

function formatPercent(value) {
  const n = Number(value) || 0
  return `${(n * 100).toFixed(2)}%`
}

function toDateText(value) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const visibleRawLine = computed(() => {
  if (!session.value) return []
  const count = session.value.historyBars + session.value.revealedSteps
  return session.value.line.slice(0, count)
})

const visibleLineWithMetric = computed(() => {
  const adjustedLine = buildAdjustedLine(visibleRawLine.value)
  return calculateMetric(adjustedLine, {
    ma: ma.value,
    macd: macd.value,
    kdj: kdj.value,
    bias: bias.value,
    volumeMa: volumeMa.value,
    enabledIndicators: enabledIndicators.value
  })
})

const chartTransactions = computed(() => {
  if (!session.value) return []
  const currentLine = visibleRawLine.value[visibleRawLine.value.length - 1]
  const anchorFactor = Number(currentLine?.foreAdjustFactor) || 1
  return session.value.closedTrades.map(item => ({
    buyTime: item.buyTime,
    buyPrice: toForwardAdjustedPrice(item.buyPrice, item.buyFactor || anchorFactor, anchorFactor),
    sellTime: item.sellTime,
    sellPrice: toForwardAdjustedPrice(item.sellPrice, item.sellFactor || anchorFactor, anchorFactor)
  }))
})

const canOperate = computed(() => {
  return Boolean(session.value && session.value.status === 'running' && session.value.revealedSteps < session.value.testBars)
})

const visibleActionLogs = computed(() => session.value?.actionLogs || [])

const currentTotalAsset = computed(() => {
  if (!session.value) return 0
  const currentClose = Number(visibleRawLine.value[visibleRawLine.value.length - 1]?.close) || 0
  return session.value.cash + session.value.shares * currentClose
})

const replayLineWithMetric = computed(() => {
  if (!replayRecord.value) return { line: [] }
  const adjustedLine = buildAdjustedLine(replayRecord.value.snapshot.line || [])
  return calculateMetric(adjustedLine, {
    ma: replayRecord.value.snapshot.ma,
    macd: replayRecord.value.snapshot.macd,
    kdj: replayRecord.value.snapshot.kdj,
    bias: replayRecord.value.snapshot.bias,
    volumeMa: replayRecord.value.snapshot.volumeMa,
    enabledIndicators: replayRecord.value.snapshot.enabledIndicators
  })
})

const replayTransactions = computed(() => {
  if (!replayRecord.value) return []
  const line = replayRecord.value.snapshot.line || []
  const anchorFactor = Number(line[line.length - 1]?.foreAdjustFactor) || 1
  return (replayRecord.value.snapshot.closedTrades || []).map(item => ({
    buyTime: item.buyTime,
    buyPrice: toForwardAdjustedPrice(item.buyPrice, item.buyFactor || anchorFactor, anchorFactor),
    sellTime: item.sellTime,
    sellPrice: toForwardAdjustedPrice(item.sellPrice, item.sellFactor || anchorFactor, anchorFactor)
  }))
})

const blindMarkers = computed(() => {
  if (!session.value || visibleRawLine.value.length === 0) return {}
  const startLine = session.value.line[session.value.historyBars]
  const endLine = session.value.line[session.value.historyBars + session.value.testBars - 1]
  const currentLine = visibleRawLine.value[visibleRawLine.value.length - 1]
  const currentPrice = Number(visibleLineWithMetric.value?.line?.[visibleLineWithMetric.value.line.length - 1]?.close)
  let positionPrice = null
  if (session.value.shares > 0 && session.value.openPosition) {
    const buyFactor = Number(session.value.openPosition.buyFactor || 1)
    const anchorFactor = Number(currentLine?.foreAdjustFactor || 1)
    if (buyFactor > 0 && anchorFactor > 0) {
      positionPrice = Number(session.value.openPosition.buyPrice) * (buyFactor / anchorFactor)
    }
  }
  return {
    startTime: startLine?.time || null,
    endTime: endLine?.time || null,
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : null,
    positionPrice: Number.isFinite(positionPrice) ? positionPrice : null
  }
})

const replayMarkers = computed(() => {
  if (!replayRecord.value) return {}
  const line = replayRecord.value.snapshot.line || []
  if (line.length === 0) return {}
  const historyBars = 300
  const testBars = 300
  const startLine = line[historyBars]
  const endLine = line[historyBars + testBars - 1] || line[line.length - 1]
  const currentPrice = Number(replayLineWithMetric.value?.line?.[replayLineWithMetric.value.line.length - 1]?.close)
  return {
    startTime: startLine?.time || null,
    endTime: endLine?.time || null,
    currentPrice: Number.isFinite(currentPrice) ? currentPrice : null,
    positionPrice: null
  }
})

function loadRecords() {
  if (!process.client) return
  try {
    const raw = localStorage.getItem(RECORD_KEY)
    records.value = raw ? JSON.parse(raw) : []
  } catch {
    records.value = []
  }
}

function saveRecords() {
  if (!process.client) return
  localStorage.setItem(RECORD_KEY, JSON.stringify(records.value.slice(0, 200)))
}

function updateSessionMetrics(price) {
  if (!session.value) return
  const currentClose = Number(price) || 0
  const totalAsset = session.value.cash + session.value.shares * currentClose
  const holdingValue = session.value.shares * currentClose
  const holdingRate = totalAsset > 0 ? holdingValue / totalAsset : 0
  session.value.avgHoldingRateSum += holdingRate
  session.value.avgHoldingRateCount += 1
  session.value.peakAsset = Math.max(session.value.peakAsset, totalAsset)
  const drawdown = session.value.peakAsset > 0 ? (session.value.peakAsset - totalAsset) / session.value.peakAsset : 0
  session.value.maxDrawdown = Math.max(session.value.maxDrawdown, drawdown)
}

function appendPositionLog(trade, closePrice, note = '') {
  if (!session.value || !trade) return
  const totalAsset = session.value.cash + session.value.shares * (Number(closePrice) || 0)
  session.value.actionLogs.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    buyPrice: Number(trade.buyPrice) || 0,
    sellPrice: Number(trade.sellPrice) || 0,
    shares: trade.shares || 0,
    pnl: Number(trade.pnl) || 0,
    totalAsset,
    note: note || `买 ${formatNumber(trade.buyPrice)} / 卖 ${formatNumber(trade.sellPrice)} / 盈亏 ${formatNumber(trade.pnl)}`
  })
}

function executeBuy(closePrice) {
  if (!session.value) return '会话不存在'
  if (session.value.shares > 0) return '已有持仓，买入忽略'

  const unitCost = closePrice * (1 + FEE_RATE)
  const lotCount = Math.floor(session.value.cash / (unitCost * 100))
  if (lotCount <= 0) return '资金不足1手，买入失败'

  const shares = lotCount * 100
  const amount = shares * closePrice
  const fee = amount * FEE_RATE
  session.value.cash -= amount + fee
  session.value.shares = shares
  session.value.openPosition = {
    buyTime: visibleRawLine.value[visibleRawLine.value.length - 1]?.time,
    buyPrice: closePrice,
    buyFactor: visibleRawLine.value[visibleRawLine.value.length - 1]?.foreAdjustFactor || 1,
    buyStep: session.value.revealedSteps,
    shares,
    cost: amount + fee
  }
  return `买入${shares}股`
}

function executeSell(closePrice, reason = 'normal') {
  if (!session.value) return '会话不存在'
  if (session.value.shares <= 0 || !session.value.openPosition) return '当前无持仓'

  const shares = session.value.shares
  const amount = shares * closePrice
  const fee = amount * FEE_RATE
  const income = amount - fee
  session.value.cash += income

  const pnl = income - session.value.openPosition.cost
  const returnRate = session.value.openPosition.cost > 0 ? pnl / session.value.openPosition.cost : 0
  session.value.closedTrades.push({
    buyTime: session.value.openPosition.buyTime,
    buyPrice: session.value.openPosition.buyPrice,
    buyFactor: session.value.openPosition.buyFactor,
    buyStep: session.value.openPosition.buyStep,
    sellTime: visibleRawLine.value[visibleRawLine.value.length - 1]?.time,
    sellStep: session.value.revealedSteps,
    sellPrice: closePrice,
    sellFactor: visibleRawLine.value[visibleRawLine.value.length - 1]?.foreAdjustFactor || 1,
    shares,
    pnl,
    returnRate,
    reason
  })
  session.value.shares = 0
  session.value.openPosition = null
  return `卖出${shares}股`
}

function rebalanceSharesByFactor(prevFactor, nextFactor) {
  if (!session.value || session.value.shares <= 0) return
  const prev = Number(prevFactor)
  const next = Number(nextFactor)
  if (!Number.isFinite(prev) || !Number.isFinite(next) || prev <= 0 || next <= 0) return
  const ratio = next / prev
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio === 1) return
  session.value.shares = session.value.shares * ratio
  if (session.value.openPosition) {
    session.value.openPosition.shares = session.value.shares
  }
}

function handleAction(action) {
  if (!canOperate.value) return
  const currentLine = visibleRawLine.value[visibleRawLine.value.length - 1]
  if (!currentLine) {
    finishSession('end')
    return
  }
  const tradePrice = Number(currentLine.close) || 0
  let note = ''
  const closedTradesCountBefore = session.value.closedTrades.length
  if (action === 'buy') note = executeBuy(tradePrice)
  if (action === 'sell') note = executeSell(tradePrice)
  if (action === 'observe') note = '观察'

  const nextIndex = session.value.historyBars + session.value.revealedSteps
  const nextLine = session.value.line[nextIndex]
  if (!nextLine) {
    updateSessionMetrics(tradePrice)
    if (session.value.closedTrades.length > closedTradesCountBefore) {
      const latestTrade = session.value.closedTrades[session.value.closedTrades.length - 1]
      appendPositionLog(latestTrade, tradePrice, note)
    }
    finishSession('end')
    return
  }

  rebalanceSharesByFactor(currentLine.foreAdjustFactor, nextLine.foreAdjustFactor)
  session.value.revealedSteps += 1
  const markPrice = Number(nextLine.close) || tradePrice
  updateSessionMetrics(markPrice)
  if (session.value.closedTrades.length > closedTradesCountBefore) {
    const latestTrade = session.value.closedTrades[session.value.closedTrades.length - 1]
    appendPositionLog(latestTrade, markPrice, note)
  }

  if (session.value.revealedSteps >= session.value.testBars) {
    finishSession('timeout')
  }
}

function finishSession(reason = 'manual') {
  if (!session.value || session.value.status === 'finished') return
  if (session.value.shares > 0) {
    const lastLine = visibleRawLine.value[visibleRawLine.value.length - 1]
    const closePrice = Number(lastLine?.close) || 0
    const closedTradesCountBefore = session.value.closedTrades.length
    const note = executeSell(closePrice, 'force')
    updateSessionMetrics(closePrice)
    if (session.value.closedTrades.length > closedTradesCountBefore) {
      const latestTrade = session.value.closedTrades[session.value.closedTrades.length - 1]
      appendPositionLog(latestTrade, closePrice, reason === 'timeout' ? '测试结束强平' : note)
    }
  }

  session.value.status = 'finished'
  const startLine = session.value.line[session.value.historyBars]
  const endLine = visibleRawLine.value[visibleRawLine.value.length - 1]
  const endFactor = Number(endLine?.foreAdjustFactor) || 1
  const startFactor = Number(startLine?.foreAdjustFactor) || endFactor
  const startAdjusted = Number(startLine?.close || 0) * (startFactor / endFactor)
  const endAdjusted = Number(endLine?.close || 0)
  const intervalReturn = startAdjusted > 0 ? endAdjusted / startAdjusted - 1 : 0

  const finalAsset = session.value.cash
  const profit = finalAsset - INITIAL_CAPITAL
  const winCount = session.value.closedTrades.filter(t => Number(t.pnl) > 0).length
  const winRate = session.value.closedTrades.length > 0 ? winCount / session.value.closedTrades.length : 0
  const avgHoldingRate = session.value.avgHoldingRateCount > 0
    ? session.value.avgHoldingRateSum / session.value.avgHoldingRateCount
    : 0

  const record = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
    stockCode: session.value.stock.code,
    stockName: session.value.stock.name,
    timeRange: `${toDateText(startLine?.time)} ~ ${toDateText(endLine?.time)}`,
    avgHoldingRate,
    winRate,
    intervalReturn,
    profit,
    maxDrawdown: session.value.maxDrawdown,
    snapshot: {
      line: session.value.line,
      closedTrades: session.value.closedTrades,
      actionLogs: session.value.actionLogs,
      enabledIndicators: enabledIndicators.value,
      ma: ma.value,
      macd: macd.value,
      kdj: kdj.value,
      bias: bias.value,
      volumeMa: volumeMa.value
    }
  }
  records.value.unshift(record)
  saveRecords()
}

async function startRandomSession() {
  loading.value = true
  errorMessage.value = ''
  replayRecord.value = null
  try {
    const response = await fetch('/api/double-blind/start', { method: 'POST' })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(text || '抽样失败')
    }
    const data = await response.json()
    session.value = {
      stock: data.stock,
      historyBars: Number(data.historyBars) || 300,
      testBars: Number(data.testBars) || 300,
      line: Array.isArray(data.line) ? data.line : [],
      revealedSteps: 0,
      status: 'running',
      cash: INITIAL_CAPITAL,
      shares: 0,
      openPosition: null,
      closedTrades: [],
      actionLogs: [],
      avgHoldingRateSum: 0,
      avgHoldingRateCount: 0,
      peakAsset: INITIAL_CAPITAL,
      maxDrawdown: 0
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : '启动失败'
  } finally {
    loading.value = false
  }
}

function backToStartPage() {
  session.value = null
}

function openReplay(record) {
  replayRecord.value = record
}

watch([ma, macd, kdj, volumeMa, bias, enabledIndicators], () => {
  saveIndicatorConfig()
}, { deep: true })

onMounted(() => {
  loadRecords()
})
</script>
