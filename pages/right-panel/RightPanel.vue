<template>
  <div class="h-full flex flex-col overflow-hidden bg-white shadow-md rounded-md">
    <!-- 标签页头部 -->
    <div class="flex border-b" style="border-color: var(--border-light);">
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
      <!-- 配置规则 Tab -->
      <div v-show="activeTab === 'config'" class="tab-pane bg-white">
        <div class="space-y-4">
          <!-- MA配置 -->
          <div class="bg-gray-50 p-3 rounded-md">
            <h4 class="font-medium text-gray-700 mb-2">MA均线配置</h4>
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
          
          <!-- MACD配置 -->
          <div class="bg-gray-50 p-3 rounded-md">
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
                <label class="block text-sm font-medium text-gray-600 mb-1">信号线 (EMA9)</label>
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
              @update:value="updateBuyConditions"
            />
          </div>
          
          <!-- 卖出算法 -->
          <div class="bg-gray-50 p-3 rounded-md">
            <h4 class="font-medium text-gray-700 mb-2">卖出算法</h4>
            <AlgorithmConfig 
              type="sell" 
              :initialValue="props.sellConditions"
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
      </div>
      
      <!-- 计算结果 Tab -->
      <div v-show="activeTab === 'results'" class="tab-pane bg-white">
        <TransactionList 
          :transactions="transactions"
          :loading="calculationLoading"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, watch } from 'vue'
import AlgorithmConfig from './AlgorithmConfig.vue'
import TransactionList from './TransactionList.vue'

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
  }
})

const emit = defineEmits([
  'update:ma',
  'update:macd',
  'update:buyConditions',
  'update:sellConditions',
  'calculation',
  'changePanelState'
])

// 本地响应式状态
const activeTab = ref('config') // 当前激活的标签页，默认为配置规则
const calculationMessage = ref('') // 计算提示消息
const messageClass = ref('text-gray-600') // 消息样式类
const calculationLoading = ref(false) // 计算加载状态
function updateBuyConditions(newValue) {
  emit('update:buyConditions', newValue)
}

function updateSellConditions(newValue) {
  emit('update:sellConditions', newValue)
}

// 计算按钮处理函数
function handleCalculation(type) {
  const params = {
    type: type, // 添加类型参数
    ma: syncedMa.value,
    macd: syncedMacd.value,
    buyConditions: props.buyConditions,
    sellConditions: props.sellConditions
  }
  
  // 显示计算提示消息
  let message = '';
  if (type === 'page') {
    message = '页内计算中...';
    calculationLoading.value = true;
    // 页内计算完成后需要重置loading状态
    setTimeout(() => {
      calculationLoading.value = false;
    }, 1000);
  } else if (type === 'star') {
    message = '星标计算任务已提交';
  } else if (type === 'global') {
    message = '全局计算任务已提交';
  }
  
  calculationMessage.value = message;
  messageClass.value = 'text-green-600';
  
  // 2秒后自动清除消息
  setTimeout(() => {
    calculationMessage.value = '';
  }, 2000);
  
  emit('calculation', params)
}

// 使用计算属性实现双向绑定
const maS = computed({
  get: () => props.ma?.s ?? 5,
  set: (val) => emit('update:ma', { ...props.ma, s: Number(val) })
})

const maM = computed({
  get: () => props.ma?.m ?? 10,
  set: (val) => emit('update:ma', { ...props.ma, m: Number(val) })
})

const maL = computed({
  get: () => props.ma?.l ?? 20,
  set: (val) => emit('update:ma', { ...props.ma, l: Number(val) })
})

const maX = computed({
  get: () => props.ma?.x ?? 60,
  set: (val) => emit('update:ma', { ...props.ma, x: Number(val) })
})

// MACD 配置的响应式数据
const macdS = computed({
  get: () => props.macd?.s ?? 12,
  set: (val) => emit('update:macd', { ...props.macd, s: Number(val) })
})

const macdL = computed({
  get: () => props.macd?.l ?? 26,
  set: (val) => emit('update:macd', { ...props.macd, l: Number(val) })
})

const macdD = computed({
  get: () => props.macd?.d ?? 9,
  set: (val) => emit('update:macd', { ...props.macd, d: Number(val) })
})

// 同步后的MA对象
const syncedMa = computed(() => ({
  s: maS.value,
  m: maM.value,
  l: maL.value,
  x: maX.value
}))

const syncedMacd = computed(() => ({
  s: macdS.value,
  l: macdL.value,
  d: macdD.value
}))





</script>

<style scoped>
.tab-content {
  min-height: 0; /* 确保flex-grow生效 */
}
</style>