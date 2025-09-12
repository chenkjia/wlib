<template>
  <div class="h-full border-b border-gray-300 flex flex-col overflow-hidden">
    <!-- Tab导航 - 固定高度 -->
    <div class="flex border-b border-gray-300 mb-4 flex-shrink-0">
      <button 
        @click="activeTab = 'params'"
        :class="['px-4 py-2 font-medium rounded-t-md transition-all', activeTab === 'params' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100']"
      >
        参数
      </button>
      <button 
        @click="activeTab = 'buyAlgo'"
        :class="['px-4 py-2 font-medium rounded-t-md transition-all', activeTab === 'buyAlgo' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100']"
      >
        买入算法
      </button>
      <button 
        @click="activeTab = 'sellAlgo'"
        :class="['px-4 py-2 font-medium rounded-t-md transition-all', activeTab === 'sellAlgo' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100']"
      >
        卖出算法
      </button>
    </div>     
    <!-- Tab内容 - 可滚动区域 -->
    <div class="tab-content overflow-y-auto flex-grow">
      <!-- 参数设置 -->
      <div v-show="activeTab === 'params'" class="tab-pane bg-white rounded-md p-2">
        <div class="space-y-3">
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
          <!-- 其他参数内容可以在这里添加 -->
        </div>
      </div>
      
      <!-- 买入算法 -->
      <div v-show="activeTab === 'buyAlgo'" class="tab-pane bg-white rounded-md p-2">
        <AlgorithmConfig 
          type="buy" 
          :initial-value="buyAlgorithm" 
          @update:value="updateBuyAlgorithm"
        />
      </div>
      
      <!-- 卖出算法 -->
      <div v-show="activeTab === 'sellAlgo'" class="tab-pane bg-white rounded-md p-2">
        <AlgorithmConfig 
          type="sell" 
          :initial-value="sellAlgorithm" 
          @update:value="updateSellAlgorithm"
        />
      </div>
    </div>
    <!-- 计算按钮 - 固定高度 -->
    <div class="flex justify-center space-x-4 mb-4 flex-shrink-0">
      <button 
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        @click="handlePageCalculation"
      >
        页内计算
      </button>
      <button 
        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
        @click="handleGlobalCalculation"
      >
        全局计算
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import AlgorithmConfig from './AlgorithmConfig.vue'

const props = defineProps({
  // 接收父组件传递的MA配置参数
  maS: {
    type: Number,
    required: true
  },
  maM: {
    type: Number,
    required: true
  },
  maL: {
    type: Number,
    required: true
  },
  maX: {
    type: Number,
    required: true
  }
})

const emit = defineEmits([
  'update:maS',
  'update:maM',
  'update:maL',
  'update:maX',
  'update:buyAlgorithm',
  'update:sellAlgorithm',
  'pageCalculation',
  'globalCalculation'
])

// 本地响应式状态

// 买入和卖出算法配置
const buyAlgorithm = ref([
  // 默认买入算法示例
  [
    "maS > maM",
    "maM > maL"
  ]
])

const sellAlgorithm = ref([
  // 默认卖出算法示例
  [
    "volumeMaS > volumeMaL * 3"
  ],
  [
    "maS < maM"
  ]
])

// 更新算法配置的方法
function updateBuyAlgorithm(newValue) {
  buyAlgorithm.value = newValue
  emit('update:buyAlgorithm', newValue)
}

function updateSellAlgorithm(newValue) {
  sellAlgorithm.value = newValue
  emit('update:sellAlgorithm', newValue)
}
const activeTab = ref('params') // 当前激活的标签页，默认为参数设置

// 计算按钮处理函数
function handlePageCalculation() {
  emit('pageCalculation')
}

function handleGlobalCalculation() {
  emit('globalCalculation')
}

// 使用计算属性实现双向绑定
const maS = computed({
  get: () => props.maS,
  set: (value) => emit('update:maS', Number(value))
})

const maM = computed({
  get: () => props.maM,
  set: (value) => emit('update:maM', Number(value))
})

const maL = computed({
  get: () => props.maL,
  set: (value) => emit('update:maL', Number(value))
})

const maX = computed({
  get: () => props.maX,
  set: (value) => emit('update:maX', Number(value))
})
</script>