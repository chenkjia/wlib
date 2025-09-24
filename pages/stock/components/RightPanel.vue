<template>
  <div class="h-full flex flex-col overflow-hidden bg-white shadow-md rounded-md">
    <!-- Tab导航 - 固定高度 -->
    <div class="flex border-b border-gray-300 mb-4 flex-shrink-0">
      <button 
        @click="activeTab = 'config'"
        :class="['px-4 py-2 font-medium rounded-t-md transition-all', activeTab === 'config' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100']"
      >
        配置规则
      </button>
      <button 
        @click="activeTab = 'results'"
        :class="['px-4 py-2 font-medium rounded-t-md transition-all', activeTab === 'results' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100']"
      >
        计算结果
      </button>
      <button 
        @click="activeTab = 'tasks'"
        :class="['px-4 py-2 font-medium rounded-t-md transition-all', activeTab === 'tasks' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100']"
      >
        任务列表
      </button>
    </div>     
    
    <!-- Tab内容 - 可滚动区域 -->
    <div class="tab-content overflow-y-auto flex-grow">
      <!-- 配置规则 Tab -->
      <div v-show="activeTab === 'config'" class="tab-pane bg-white rounded-md p-2">
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
      <div v-show="activeTab === 'results'" class="tab-pane bg-white rounded-md p-2">
        <div class="flex flex-col h-full">
          <!-- 买卖清单 -->
          <div class="bg-gray-50 p-3 rounded-md flex-grow overflow-y-auto">
            <h4 class="font-medium text-gray-700 mb-2">买卖清单</h4>
            <div v-if="transactions && transactions.length > 0" class="overflow-x-auto">
              <table class="min-w-full bg-white">
                <thead>
                  <tr>
                    <th class="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">序号</th>
                    <th class="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">买入日期</th>
                    <th class="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">买入价格</th>
                    <th class="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">卖出日期</th>
                    <th class="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">卖出价格</th>
                    <th class="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">持续天数</th>
                    <th class="py-2 px-3 border-b border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">收益率</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(transaction, index) in transactions" :key="index" class="hover:bg-gray-50">
                    <td class="py-2 px-3 border-b border-gray-200 text-sm">{{ index + 1 }}</td>
                    <td class="py-2 px-3 border-b border-gray-200 text-sm">{{ formatDate(transaction.buyTime) }}</td>
                    <td class="py-2 px-3 border-b border-gray-200 text-sm">{{ transaction.buyPrice }}</td>
                    <td class="py-2 px-3 border-b border-gray-200 text-sm">{{ formatDate(transaction.sellTime) }}</td>
                    <td class="py-2 px-3 border-b border-gray-200 text-sm">{{ transaction.sellPrice }}</td>
                    <td class="py-2 px-3 border-b border-gray-200 text-sm">{{ transaction.duration || '-' }}</td>
                    <td class="py-2 px-3 border-b border-gray-200 text-sm" :class="getColorClass(transaction.profit)">
                      {{ formatProfit(transaction.profit) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center py-4 text-gray-500">
              暂无交易记录
            </div>
          </div>
        </div>
      </div>
      
      <!-- 任务列表 Tab -->
      <div v-show="activeTab === 'tasks'" class="tab-pane bg-white rounded-md p-2">
        <TaskList />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed } from 'vue'
import AlgorithmConfig from './AlgorithmConfig.vue'
import TaskList from './TaskList.vue'

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
  'update:buyConditions',
  'update:sellConditions',
  'calculation'
])

// 本地响应式状态
const activeTab = ref('config') // 当前激活的标签页，默认为配置规则
const calculationMessage = ref('') // 计算提示消息
const messageClass = ref('text-gray-600') // 消息样式类

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
    buyConditions: props.buyConditions,
    sellConditions: props.sellConditions
  }
  
  // 显示计算提示消息
  let message = '';
  if (type === 'page') {
    message = '页内计算任务已提交';
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

// 同步后的MA对象
const syncedMa = computed(() => ({
  s: maS.value,
  m: maM.value,
  l: maL.value,
  x: maX.value
}))

// 计算平均收益
const averageProfit = computed(() => {
  if (!props.transactions || props.transactions.length === 0) return 0
  const totalProfit = props.transactions.reduce((sum, t) => sum + (t.profit || 0), 0)
  return totalProfit / props.transactions.length
})

// 日期格式化函数
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

// 格式化收益率
function formatProfit(profit) {
  if (profit === undefined || profit === null) return '-'
  return `${profit.toFixed(2)}%`
}

// 获取收益率颜色类
function getColorClass(profit) {
  if (profit === undefined || profit === null) return ''
  return profit > 0 ? 'text-green-600' : 'text-red-600'
}


</script>

<style scoped>
.tab-content {
  min-height: 0; /* 确保flex-grow生效 */
}
</style>