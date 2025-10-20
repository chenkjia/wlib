<template>
  <div class="space-y-2 pt-3">
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

    <!-- KDJ 开关 -->
    <div class="pl-3 pr-3">
      <label class="flex items-center">
        <input 
          type="checkbox" 
          v-model="enabledIndicators" 
          value="kdj"
          class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span class="text-sm font-medium text-gray-700">KDJ</span>
      </label>
    </div>
    <!-- KDJ 配置 -->
    <div v-show="enabledIndicators.includes('kdj')" class="bg-gray-50 p-3 rounded-md">
      <h4 class="font-medium text-gray-700 mb-2">KDJ配置</h4>
      <div class="grid grid-cols-3 gap-3">
        <!-- RSV 周期 N -->
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">RSV周期 (N)</label>
          <div class="flex items-center">
            <input 
              type="number" 
              v-model="kdjN" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="5"
              max="30"
            />
          </div>
        </div>
        <!-- K 平滑 K -->
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">K平滑 (K)</label>
          <div class="flex items-center">
            <input 
              type="number" 
              v-model="kdjK" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="1"
              max="10"
            />
          </div>
        </div>
        <!-- D 平滑 D -->
        <div>
          <label class="block text-sm font-medium text-gray-600 mb-1">D平滑 (D)</label>
          <div class="flex items-center">
            <input 
              type="number" 
              v-model="kdjD" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              min="1"
              max="10"
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
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue'
import AlgorithmConfig from './AlgorithmConfig.vue'

const props = defineProps({
  ma: {
    type: Object,
    default: () => ({
      s: 5,
      m: 10,
      l: 20,
      x: 60
    })
  },
  macd: {
    type: Object,
    default: () => ({
      s: 12,
      l: 26,
      d: 9
    })
  },
  kdj: {
    type: Object,
    default: () => ({
      n: 9,
      k: 3,
      d: 3
    })
  },
  enabledIndicators: {
    type: Array,
    default: () => ['ma', 'macd']
  },
  buyConditions: {
    type: Array,
    default: () => []
  },
  sellConditions: {
    type: Array,
    default: () => []
  },
  calculationLoading: {
    type: Boolean,
    default: false
  },
  calculationMessage: {
    type: String,
    default: ''
  }
})

const emit = defineEmits([
  'update:ma',
  'update:macd',
  'update:kdj',
  'update:buyConditions',
  'update:sellConditions',
  'update:enabledIndicators',
  'calculation'
])

// 双向绑定：指标开关
const enabledIndicators = computed({
  get: () => props.enabledIndicators,
  set: (val) => emit('update:enabledIndicators', val)
})

// MA 参数
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

// MACD 参数
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

// 计算提示样式
const messageClass = computed(() => props.calculationLoading ? 'text-yellow-600' : 'text-green-600')

// 事件：更新买入/卖出条件
function updateBuyConditions(value) {
  emit('update:buyConditions', value)
}
function updateSellConditions(value) {
  emit('update:sellConditions', value)
}

// 事件：计算（仅向上传递类型，父组件负责组装payload）
function handleCalculation(type) {
  emit('calculation', type)
}
</script>