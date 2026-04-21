<template>
  <div class="h-full flex flex-col overflow-hidden bg-white shadow-md rounded-md">
    <!-- 标签页头部 -->
    <div class="flex border-b" style="border-color: var(--border-light);">
      <button
        v-if="showIndicatorsTab"
        @click="activeTab = 'indicators'"
        :class="[
          'flex-1 px-4 py-3 text-sm font-medium transition-colors',
          activeTab === 'indicators' 
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]"
      >
        指标管理
      </button>
      <button
        @click="activeTab = 'config'"
        :class="[
          'flex-1 px-4 py-3 text-sm font-medium transition-colors',
          activeTab === 'config' 
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]"
      >
        配置规则
      </button>
      <button
        @click="activeTab = 'results'"
        :class="[
          'flex-1 px-4 py-3 text-sm font-medium transition-colors',
          activeTab === 'results' 
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50' 
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]"
      >
        计算结果
      </button>
      <button
        @click="activeTab = 'macd'"
        :class="[
          'flex-1 px-4 py-3 text-sm font-medium transition-colors',
          activeTab === 'macd'
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]"
      >
        MACD分析
      </button>
      <button
        @click="activeTab = 'simulator'"
        :class="[
          'flex-1 px-4 py-3 text-sm font-medium transition-colors',
          activeTab === 'simulator'
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
        ]"
      >
        买点模拟器
      </button>
    </div>     
    
    <!-- Tab内容 - 可滚动区域 -->
    <div class="tab-content overflow-y-auto flex-grow">
      <!-- 参数管理 Tab（空内容） -->
      <div v-if="showIndicatorsTab && activeTab === 'indicators'" class="tab-pane bg-white">
        <!-- 替换为独立组件 -->
        <IndicatorList 
          :panelState="props.panelState" 
          :ma="syncSettings.ma" 
          :macd="syncSettings.macd" 
          :enabledIndicators="syncSettings.enabledIndicators"
          @changePanelState="handleExpandPanel" 
        />
      </div>
      <div v-show="activeTab === 'config'" class="space-y-2 pt-3">
        <div class="mx-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <label class="flex items-center justify-between gap-3 text-sm text-gray-700">
            <span>切换股票时自动计算买卖点</span>
            <input
              v-model="autoCalculateSignalsModel"
              type="checkbox"
              class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            >
          </label>
        </div>
        <ConfigRules
          :ma="props.ma"
          :macd="props.macd"
          :kdj="props.kdj"
          :enabledIndicators="enabledIndicators"
          :buyConditions="props.buyConditions"
          :sellConditions="props.sellConditions"
          :calculationLoading="calculationLoading"
          :calculationMessage="calculationMessage"
          @update:ma="val => emit('update:ma', val)"
          @update:macd="val => emit('update:macd', val)"
          @update:kdj="val => emit('update:kdj', val)"
          @update:buyConditions="updateBuyConditions"
          @update:sellConditions="updateSellConditions"
          @update:enabledIndicators="val => emit('update:enabledIndicators', val)"
          @calculation="handleCalculation"
        />
      </div>
        <!-- 计算结果 Tab -->
        <div v-show="activeTab === 'results'" class="tab-pane bg-white">
          <TransactionList 
            :transactions="transactions"
            :loading="calculationLoading"
            @focusChart="handleFocusChart"
          />
        </div>
        <div v-show="activeTab === 'macd'" class="p-3 space-y-3">
          <div v-if="!macdAnalysis.ready" class="rounded-md border border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-600">
            {{ macdAnalysis.message }}
          </div>
          <template v-else>
            <div class="grid grid-cols-2 gap-2">
              <div
                :class="[
                  'rounded-md border px-3 py-2 text-xs font-medium',
                  macdAnalysis.difAboveZero ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
                ]"
              >
                {{ macdAnalysis.difZeroLabel }}
              </div>
              <div
                :class="[
                  'rounded-md border px-3 py-2 text-xs font-medium',
                  macdAnalysis.difAboveDea ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
                ]"
              >
                {{ macdAnalysis.difDeaLabel }}
              </div>
              <div
                :class="[
                  'rounded-md border px-3 py-2 text-xs font-medium',
                  macdAnalysis.isRedBar ? 'border-red-200 bg-red-50 text-red-700' : 'border-green-200 bg-green-50 text-green-700'
                ]"
              >
                {{ macdAnalysis.barLabel }}
              </div>
              <div class="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700">
                {{ macdAnalysis.crossLabel }}
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div class="text-[11px] text-gray-500">DIF</div>
                <div class="text-sm font-semibold text-gray-800">{{ macdAnalysis.difValue }}</div>
              </div>
              <div class="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div class="text-[11px] text-gray-500">DEA</div>
                <div class="text-sm font-semibold text-gray-800">{{ macdAnalysis.deaValue }}</div>
              </div>
              <div class="rounded-md border border-gray-200 bg-white px-3 py-2">
                <div class="text-[11px] text-gray-500">BAR</div>
                <div class="text-sm font-semibold text-gray-800">{{ macdAnalysis.barValue }}</div>
              </div>
            </div>
            <div class="rounded-md border border-gray-200 bg-white px-3 py-3">
              <div class="text-xs font-medium text-gray-600">动能解读</div>
              <div class="mt-1 text-sm text-gray-800">{{ macdAnalysis.summary }}</div>
            </div>
            <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
              K线数量：{{ macdAnalysis.kLineCount }}，建议最少：{{ macdRequiredKLineCount }}
            </div>
          </template>
        </div>
        <div v-show="activeTab === 'simulator'" class="p-3 space-y-3">
          <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
            仅当前股票 · 日线 · 收盘后确认 · 连续命中仅记首个
          </div>
          <div class="rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
            <label class="flex items-center justify-between gap-3 text-sm text-gray-700">
              <span>切换股票时自动计算买点</span>
              <input
                v-model="autoCalculateSimulator"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              >
            </label>
          </div>
          <div class="rounded-md border border-gray-200 bg-white p-3">
            <div class="mb-2 text-xs font-medium text-gray-600">买点规则（仅用于模拟器）</div>
            <AlgorithmConfig
              type="buy"
              :initialValue="simulatorBuyConditions"
              :enabledIndicators="enabledIndicators"
              @update:value="updateSimulatorBuyConditions"
            />
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="!simulatorReady"
              @click="runBuyPointSimulation"
            >
              开始模拟
            </button>
            <span class="text-xs text-gray-500">命中 {{ simulatedBuyPoints.length }} 个买点</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              class="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="simulatedBuyPoints.length === 0 || simulatorCursor <= 0"
              @click="focusPrevBuyPoint"
            >
              上一个买点
            </button>
            <button
              class="rounded-md border border-gray-300 px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
              :disabled="simulatedBuyPoints.length === 0 || simulatorCursor >= simulatedBuyPoints.length - 1"
              @click="focusNextBuyPoint"
            >
              下一个买点
            </button>
            <span class="text-xs text-gray-500">
              {{ simulatedBuyPoints.length ? `第 ${simulatorCursor + 1} / ${simulatedBuyPoints.length} 个` : '--' }}
            </span>
          </div>
          <div class="rounded-md border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
            {{ simulatorStatusText }}
          </div>
        </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, watch, onMounted } from 'vue'
import { algorithmMap, evaluateConditionTree } from '~/utils/algorithmUtils.js'
import AlgorithmConfig from './AlgorithmConfig.vue'
import TransactionList from './TransactionList.vue'
import IndicatorList from './IndicatorList.vue'
import ConfigRules from './ConfigRules.vue'

const props = defineProps({
  // MA配置参数
  ma: {
    type: Object,
    default: () => ({
      s: 5,
      m: 10,
      l: 20,
      x: 60
    })
  },
  // MACD配置参数
  macd: {
    type: Object,
    default: () => ({
      s: 12,
      l: 26,
      d: 9
    })
  },
  // KDJ配置参数
  kdj: {
    type: Object,
    default: () => ({
      n: 9,
      k: 3,
      d: 3
    })
  },
  // 启用的指标
  enabledIndicators: {
    type: Array,
    default: () => ['ma', 'macd']
  },
  // 交易数据
  transactions: {
    type: Array,
    default: () => []
  },
  simulatedBuyPoints: {
    type: Array,
    default: () => []
  },
  // 买入算法
  buyConditions: {
      type: Array,
      default: () => []
    },
  // 卖出条件
  sellConditions: {
    type: Array,
    default: () => []
  },
  // 面板状态（用于右栏展开/恢复按钮）
  panelState: {
    type: String,
    default: 'normal'
  },
  dayLineWithMetric: {
    type: Object,
    default: () => ({})
  },
  selectedStockCode: {
    type: String,
    default: ''
  },
  autoCalculateSignals: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits([
  'update:ma',
  'update:macd',
  'update:kdj',
  'update:buyConditions',
  'update:sellConditions',
  'update:enabledIndicators',
  'update:autoCalculateSignals',
  'calculation',
  'changePanelState',
  'focusChart',
  'updateSimulatedBuyPoints'
])

// 本地响应式状态
const showIndicatorsTab = false
const activeTab = ref('config')

// 用于“配置规则”里指标开关的双向绑定
const enabledIndicators = computed({
  get: () => props.enabledIndicators,
  set: (val) => emit('update:enabledIndicators', val)
})
const autoCalculateSignalsModel = computed({
  get: () => props.autoCalculateSignals,
  set: (val) => emit('update:autoCalculateSignals', Boolean(val))
})

// 计算属性（与父组件双向绑定）
const maS = computed({
  get: () => props.ma.s,
  set: (val) => emit('update:ma', { ...props.ma, s: Number(val) })
})
const maM = computed({
  get: () => props.ma.m,
  set: (val) => emit('update:ma', { ...props.ma, m: Number(val) })
})
const maL = computed({
  get: () => props.ma.l,
  set: (val) => emit('update:ma', { ...props.ma, l: Number(val) })
})
const maX = computed({
  get: () => props.ma.x,
  set: (val) => emit('update:ma', { ...props.ma, x: Number(val) })
})

const macdS = computed({
  get: () => props.macd.s,
  set: (val) => emit('update:macd', { ...props.macd, s: Number(val) })
})
const macdL = computed({
  get: () => props.macd.l,
  set: (val) => emit('update:macd', { ...props.macd, l: Number(val) })
})
const macdD = computed({
  get: () => props.macd.d,
  set: (val) => emit('update:macd', { ...props.macd, d: Number(val) })
})

// KDJ 参数
const kdjN = computed({
  get: () => props.kdj.n,
  set: (val) => emit('update:kdj', { ...props.kdj, n: Number(val) })
})
const kdjK = computed({
  get: () => props.kdj.k,
  set: (val) => emit('update:kdj', { ...props.kdj, k: Number(val) })
})
const kdjD = computed({
  get: () => props.kdj.d,
  set: (val) => emit('update:kdj', { ...props.kdj, d: Number(val) })
})

// 同步对象（供子组件使用）
const syncSettings = computed(() => ({
  ma: { s: maS.value, m: maM.value, l: maL.value, x: maX.value },
  macd: { s: macdS.value, l: macdL.value, d: macdD.value },
  kdj: { n: kdjN.value, k: kdjK.value, d: kdjD.value },
  buyConditions: props.buyConditions,
  sellConditions: props.sellConditions,
  enabledIndicators: enabledIndicators.value
}))

// 计算事件处理
function handleCalculation(type) {
  emit('calculation', {
    type,
    ...syncSettings.value
  })
}

// 更新算法配置
function updateBuyConditions(value) {
  emit('update:buyConditions', value)
}
function updateSellConditions(value) {
  emit('update:sellConditions', value)
}

// 聚焦图表事件
function handleFocusChart(item) {
  emit('focusChart', item)
}

// 右栏展开/恢复按钮处理
function handleExpandPanel(newState) {
  // 兼容旧值 'expanded'，统一转换为右栏专用 'rightExpanded'，否则直接透传
  const mappedState = newState === 'expanded' ? 'rightExpanded' : newState
  emit('changePanelState', mappedState)
}

// 监听启用的指标变化（用于动态显示配置）
watch(enabledIndicators, (newVal) => {
  // 可添加需要的副作用处理
}, { deep: true })

// 计算提示信息（示例）
const calculationMessage = ref('')
const calculationLoading = ref(false)
const messageClass = computed(() => calculationLoading.value ? 'text-yellow-600' : 'text-green-600')
const macdRequiredKLineCount = computed(() => Number(props.macd?.l || 26) + Number(props.macd?.d || 9) - 1)
const simulatedBuyPoints = ref([])
const simulatorCursor = ref(-1)
const simulatorBuyConditions = ref([])
const autoCalculateSimulator = ref(process.client ? JSON.parse(localStorage.getItem('stock_config_autoCalculateSimulator') || 'true') : true)

function getSimulatorLocalConfig() {
  if (!process.client) return [{ type: 'group', op: 'AND', children: [] }]
  const stored = localStorage.getItem('stock_config_simulator_buy_conditions')
  if (!stored) return [{ type: 'group', op: 'AND', children: [] }]
  try {
    const parsed = JSON.parse(stored)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [{ type: 'group', op: 'AND', children: [] }]
  } catch (error) {
    return [{ type: 'group', op: 'AND', children: [] }]
  }
}

if (process.client) {
  simulatorBuyConditions.value = getSimulatorLocalConfig()
}

function hasInvalidGroup(groups = []) {
  return groups.some((group) => {
    if (Array.isArray(group)) return group.length === 0
    if (group && typeof group === 'object') {
      if (group.type === 'group') return !Array.isArray(group.children) || group.children.length === 0
      if (group.type === 'condition') return !group.value
    }
    return true
  })
}

const simulatorReady = computed(() => {
  const hasData = Array.isArray(props.dayLineWithMetric?.data) && props.dayLineWithMetric.data.length > 0
  const hasRules = Array.isArray(simulatorBuyConditions.value) && simulatorBuyConditions.value.length > 0 && !hasInvalidGroup(simulatorBuyConditions.value)
  return hasData && hasRules
})

function updateSimulatorBuyConditions(value) {
  simulatorBuyConditions.value = Array.isArray(value) ? value : []
  if (process.client) {
    localStorage.setItem('stock_config_simulator_buy_conditions', JSON.stringify(simulatorBuyConditions.value))
  }
}

function formatSimulatorTime(value) {
  if (!value) return '--'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--'
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const simulatorStatusText = computed(() => {
  if (!Array.isArray(props.dayLineWithMetric?.data) || props.dayLineWithMetric.data.length === 0) return '请先选择股票并加载日线数据'
  if (!Array.isArray(simulatorBuyConditions.value) || simulatorBuyConditions.value.length === 0 || hasInvalidGroup(simulatorBuyConditions.value)) return '请先在“买点规则（仅用于模拟器）”中配置有效条件'
  if (simulatedBuyPoints.value.length === 0) return '尚未命中买点，点击“开始模拟”执行扫描'
  const current = simulatedBuyPoints.value[simulatorCursor.value]
  if (!current) return '暂无当前买点'
  return `当前买点：${formatSimulatorTime(current.time)}，价格 ${Number(current.price).toFixed(2)}`
})

function evaluateBuyGroup(group, index) {
  if (Array.isArray(group)) {
    return group.every((conditionType) => {
      const cond = algorithmMap[conditionType]
      if (!cond || typeof cond.func !== 'function') return false
      try {
        return Boolean(cond.func(index, props.dayLineWithMetric))
      } catch (error) {
        return false
      }
    })
  }
  if (group && typeof group === 'object') {
    const context = {
      datasets: { day: props.dayLineWithMetric },
      indices: { day: index, week: -1, hour: -1 }
    }
    return evaluateConditionTree(group, context)
  }
  return false
}

function focusPointByCursor() {
  if (simulatorCursor.value < 0 || simulatorCursor.value >= simulatedBuyPoints.value.length) return
  const point = simulatedBuyPoints.value[simulatorCursor.value]
  emit('focusChart', {
    buyIndex: point.index,
    sellIndex: point.index
  })
}

function runBuyPointSimulation() {
  if (!simulatorReady.value) return
  const line = props.dayLineWithMetric?.data || []
  const buyConditions = simulatorBuyConditions.value || []
  if (!Array.isArray(line) || line.length === 0 || !Array.isArray(buyConditions) || buyConditions.length === 0) {
    simulatedBuyPoints.value = []
    simulatorCursor.value = -1
    emit('updateSimulatedBuyPoints', [])
    return
  }

  const points = []
  let buyStep = 0
  const buyLength = buyConditions.length
  let lastTriggeredIndex = -2

  for (let index = 0; index < line.length; index++) {
    const group = buyConditions[buyStep]
    const buyResult = evaluateBuyGroup(group, index)
    if (buyResult) {
      buyStep++
    }
    if (buyStep === buyLength) {
      // 连续多天满足时仅记录首次命中
      if (index !== lastTriggeredIndex + 1) {
        points.push({
          index,
          time: line[index]?.time,
          price: Number(line[index]?.close)
        })
      }
      lastTriggeredIndex = index
      buyStep = 0
    }
  }

  simulatedBuyPoints.value = points
  emit('updateSimulatedBuyPoints', points)
  simulatorCursor.value = points.length > 0 ? points.length - 1 : -1 // 从最近买点开始
  focusPointByCursor()
}

function focusPrevBuyPoint() {
  if (simulatorCursor.value <= 0) return
  simulatorCursor.value -= 1
  focusPointByCursor()
}

function focusNextBuyPoint() {
  if (simulatorCursor.value >= simulatedBuyPoints.value.length - 1) return
  simulatorCursor.value += 1
  focusPointByCursor()
}

watch(() => [props.selectedStockCode, props.dayLineWithMetric?.data?.length || 0], () => {
  if (autoCalculateSimulator.value && simulatorReady.value) {
    runBuyPointSimulation()
  } else {
    simulatedBuyPoints.value = []
    simulatorCursor.value = -1
    emit('updateSimulatedBuyPoints', [])
  }
})

watch(autoCalculateSimulator, (value) => {
  if (process.client) {
    localStorage.setItem('stock_config_autoCalculateSimulator', JSON.stringify(Boolean(value)))
  }
})

function formatMetricValue(value) {
  return Number.isFinite(value) ? value.toFixed(4) : '--'
}

const macdAnalysis = computed(() => {
  if (!props.selectedStockCode) {
    return {
      ready: false,
      message: '请先在左侧选择股票'
    }
  }

  if (!props.enabledIndicators.includes('macd')) {
    return {
      ready: false,
      message: '请先在配置规则中启用 MACD'
    }
  }

  const { dif = [], dea = [], bar = [], data = [] } = props.dayLineWithMetric || {}
  const usableLength = Math.min(dif.length, dea.length, bar.length)
  if (usableLength < 1) {
    return {
      ready: false,
      message: '当前股票暂无可用的 MACD 数据'
    }
  }

  const lastIndex = usableLength - 1
  const prevIndex = usableLength - 2
  const difLast = Number(dif[lastIndex])
  const deaLast = Number(dea[lastIndex])
  const barLast = Number(bar[lastIndex])
  const difPrev = prevIndex >= 0 ? Number(dif[prevIndex]) : null
  const deaPrev = prevIndex >= 0 ? Number(dea[prevIndex]) : null
  const barPrev = prevIndex >= 0 ? Number(bar[prevIndex]) : null

  if (![difLast, deaLast, barLast].every(Number.isFinite)) {
    return {
      ready: false,
      message: '当前 MACD 数值无效，请稍后重试'
    }
  }

  let crossLabel = '无新交叉'
  if (Number.isFinite(difPrev) && Number.isFinite(deaPrev)) {
    if (difPrev <= deaPrev && difLast > deaLast) {
      crossLabel = '最新信号：金叉'
    } else if (difPrev >= deaPrev && difLast < deaLast) {
      crossLabel = '最新信号：死叉'
    }
  }

  let momentumLabel = '动能稳定'
  if (Number.isFinite(barPrev)) {
    if (barLast > 0 && barLast > barPrev) momentumLabel = '红柱放大，动能增强'
    if (barLast > 0 && barLast < barPrev) momentumLabel = '红柱缩短，动能放缓'
    if (barLast < 0 && barLast < barPrev) momentumLabel = '绿柱放大，空头增强'
    if (barLast < 0 && barLast > barPrev) momentumLabel = '绿柱缩短，空头减弱'
  }

  const difAboveZero = difLast >= 0
  const difAboveDea = difLast >= deaLast
  const isRedBar = barLast >= 0
  const baseTrend = difAboveZero && difAboveDea
    ? '多头偏强'
    : (!difAboveZero && !difAboveDea ? '空头偏弱' : (difAboveZero ? '零轴上方回调' : '零轴下方修复'))

  return {
    ready: true,
    difAboveZero,
    difAboveDea,
    isRedBar,
    difZeroLabel: difAboveZero ? 'DIF 在0轴上方' : 'DIF 在0轴下方',
    difDeaLabel: difAboveDea ? 'DIF 在DEA上方' : 'DIF 在DEA下方',
    barLabel: isRedBar ? '当前红柱' : '当前绿柱',
    crossLabel,
    difValue: formatMetricValue(difLast),
    deaValue: formatMetricValue(deaLast),
    barValue: formatMetricValue(barLast),
    summary: `${baseTrend}，${crossLabel.replace('最新信号：', '')}，${momentumLabel}`,
    kLineCount: data.length || usableLength
  }
})

onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.tab-content {
  min-height: 0; /* 确保flex-grow生效 */
}
</style>
