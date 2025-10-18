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
          <div class="pl-3 pr-3">
            <label class="flex items-center">
              <input 
                type="checkbox" 
                v-model="enabledIndicators" 
                value="ma"
                class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span class="text-sm font-medium text-gray-700">MA均线</span>
            </label>
          </div>
          <!-- MA配置 -->
          <div v-show="enabledIndicators.includes('ma')" class="bg-gray-50 p-3 rounded-md">
            
            <div class="grid grid-cols-2 gap-3">
              <!-- 短期MA -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">短期MA (maS)</label>
                <div class="flex items-center">
                  <input 
                    type="number" 
                    v-model="maS" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="1"
                    max="30"
                  />
                </div>
              </div>
              <!-- 中期MA -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">中期MA (maM)</label>
                <div class="flex items-center">
                  <input 
                    type="number" 
                    v-model="maM" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="5"
                    max="60"
                  />
                </div>
              </div>
              <!-- 长期MA -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">长期MA (maL)</label>
                <div class="flex items-center">
                  <input 
                    type="number" 
                    v-model="maL" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="10"
                    max="120"
                  />
                </div>
              </div>
              <!-- 超长期MA -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">超长期MA (maX)</label>
                <div class="flex items-center">
                  <input 
                    type="number" 
                    v-model="maX" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="30"
                    max="250"
                  />
                </div>
              </div>
            </div>
          </div>
          <div class="pl-3 pr-3">
              <label class="flex items-center">
                <input 
                  type="checkbox" 
                  v-model="enabledIndicators" 
                  value="macd"
                  class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span class="text-sm font-medium text-gray-700">MACD</span>
              </label>
          </div>
          <!-- MACD配置 -->
          <div v-show="enabledIndicators.includes('macd')" class="bg-gray-50 p-3 rounded-md">
            <h4 class="font-medium text-gray-700 mb-2">MACD配置</h4>
            <div class="grid grid-cols-3 gap-3">
              <!-- 快线 -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">快线 (EMA12)</label>
                <div class="flex items-center">
                  <input 
                    type="number" 
                    v-model="macdS" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="5"
                    max="30"
                  />
                </div>
              </div>
              <!-- 慢线 -->
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">慢线 (EMA26)</label>
                <div class="flex items-center">
                   <input 
                     type="number" 
                     v-model="macdL" 
                     class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                     min="15"
                     max="50"
                   />
                 </div>
              </div>
              <!-- 信号线 -->
              <div>
                <label class="block textsm font-medium text-gray-600 mb-1">信号线 (EMA9)</label>
                <div class="flex items-center">
                  <input 
                    type="number" 
                    v-model="macdD" 
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                    min="3"
                    max="20"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <!-- 买入算法 -->
          <div class="bg-gray-50 p-3 rounded-md">
            <h4 class="font-medium text-gray-700 mb-2">买入算法</h4>
            <AlgorithmConfig 
              type="buy" 
              :initialValue="props.buyConditions"
              :enabledIndicators="enabledIndicators"
              @update:value="updateBuyConditions"
            />
          </div>
          
          <!-- 卖出算法 -->
          <div class="bg-gray-50 p-3 rounded-md">
            <h4 class="font-medium text-gray-700 mb-2">卖出算法</h4>
            <AlgorithmConfig 
              type="sell" 
              :initialValue="props.sellConditions"
              :enabledIndicators="enabledIndicators"
              @update:value="updateSellConditions"
            />
          </div>
          
          <!-- 计算按钮 -->
          <div class="flex justify-center space-x-4 mt-4">
            <button 
              class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
              @click="handleCalculation('page')"
            >
              页内计算
            </button>
            <button 
              class="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
              @click="handleCalculation('star')"
            >
              星标计算
            </button>
            <button 
              class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
              @click="handleCalculation('global')"
            >
              全局计算
            </button>
          </div>
          
          <!-- 计算提示信息 -->
          <div v-if="calculationMessage" class="text-center mt-2 text-sm" :class="messageClass">
            {{ calculationMessage }}
          </div>
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

const enabledIndicators = computed({
  get: () => props.enabledIndicators,
  set: (val) => emit('update:enabledIndicators', val)
})

// 同步对象（供子组件使用）
const syncSettings = computed(() => ({
  ma: { s: maS.value, m: maM.value, l: maL.value, x: maX.value },
  macd: { s: macdS.value, l: macdL.value, d: macdD.value },
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