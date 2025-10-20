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
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, watch, onMounted } from 'vue'
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
  }
})

const emit = defineEmits([
  'update:ma',
  'update:macd',
  'update:kdj',
  'update:buyConditions',
  'update:sellConditions',
  'update:enabledIndicators',
  'calculation',
  'changePanelState',
  'focusChart'
])

// 本地响应式状态
const showIndicatorsTab = false
const activeTab = ref('config')

// 用于“配置规则”里指标开关的双向绑定
const enabledIndicators = computed({
  get: () => props.enabledIndicators,
  set: (val) => emit('update:enabledIndicators', val)
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

onMounted(() => {
  // 初始化逻辑
})
</script>

<style scoped>
.tab-content {
  min-height: 0; /* 确保flex-grow生效 */
}
</style>