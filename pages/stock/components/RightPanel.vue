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
        @click="activeTab = 'queue'"
        :class="['px-4 py-2 font-medium rounded-t-md transition-all', activeTab === 'queue' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100']"
      >
        计算队列
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
              :initialValue="props.buyAlgorithm" 
              @update:value="updateBuyAlgorithm"
            />
          </div>
          
          <!-- 卖出算法 -->
          <div class="bg-gray-50 p-3 rounded-md">
            <h4 class="font-medium text-gray-700 mb-2">卖出算法</h4>
            <AlgorithmConfig 
              type="sell" 
              :initialValue="props.sellAlgorithm" 
              @update:value="updateSellAlgorithm"
            />
          </div>
          
          <!-- 计算按钮 -->
          <div class="flex justify-center space-x-4 mt-4">
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
      </div>
      
      <!-- 计算结果 Tab -->
      <div v-show="activeTab === 'results'" class="tab-pane bg-white rounded-md p-2">
        <div class="flex flex-col h-full">
          <!-- 上半部分：买卖统计 -->
          <div class="bg-gray-50 p-3 rounded-md mb-4">
            <h4 class="font-medium text-gray-700 mb-2">买卖统计</h4>
            <div v-if="transactions && transactions.length > 0">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white p-3 rounded-md shadow-sm">
                  <div class="text-sm text-gray-500">总交易次数</div>
                  <div class="text-xl font-semibold">{{ transactions.length }}</div>
                </div>
                <div class="bg-white p-3 rounded-md shadow-sm">
                  <div class="text-sm text-gray-500">盈利次数</div>
                  <div class="text-xl font-semibold text-green-600">
                    {{ transactions.filter(t => t.profit > 0).length }}
                  </div>
                </div>
                <div class="bg-white p-3 rounded-md shadow-sm">
                  <div class="text-sm text-gray-500">亏损次数</div>
                  <div class="text-xl font-semibold text-red-600">
                    {{ transactions.filter(t => t.profit <= 0).length }}
                  </div>
                </div>
                <div class="bg-white p-3 rounded-md shadow-sm">
                  <div class="text-sm text-gray-500">平均收益</div>
                  <div class="text-xl font-semibold" :class="averageProfit > 0 ? 'text-green-600' : 'text-red-600'">
                    {{ averageProfit.toFixed(2) }}%
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-gray-500 py-4">
              暂无交易数据
            </div>
          </div>
          
          <!-- 下半部分：买卖清单 -->
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
                    <td class="py-2 px-3 border-b border-gray-200 text-sm" :class="transaction.profit > 0 ? 'text-green-600' : 'text-red-600'">
                      {{ transaction.profit?.toFixed(2) }}%
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center text-gray-500 py-4">
              暂无交易数据
            </div>
          </div>
        </div>
      </div>
      
      <!-- 计算队列 Tab -->
      <div v-show="activeTab === 'queue'" class="tab-pane bg-white rounded-md p-2">
        <div class="flex flex-col h-full">
          <!-- 上半部分：计算结果展示区 -->
          <div class="bg-gray-50 p-3 rounded-md mb-4">
            <h4 class="font-medium text-gray-700 mb-2">计算结果</h4>
            <div v-if="calculationResult" class="bg-white p-3 rounded-md shadow-sm">
              <div class="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <div class="text-sm text-gray-500">任务ID</div>
                  <div class="text-sm font-mono">{{ calculationResult.taskId || '-' }}</div>
                </div>
                <div>
                  <div class="text-sm text-gray-500">计算时间</div>
                  <div class="text-sm">{{ formatDateTime(calculationResult.timestamp) }}</div>
                </div>
              </div>
              
              <div class="border-t border-gray-100 pt-3 mt-2">
                <h5 class="text-sm font-medium text-gray-700 mb-2">统计指标</h5>
                <div class="grid grid-cols-2 gap-4">
                  <div>
                    <div class="text-sm text-gray-500">总收益率</div>
                    <div class="text-lg font-semibold" :class="calculationResult.stats?.totalProfit > 0 ? 'text-green-600' : 'text-red-600'">
                      {{ calculationResult.stats?.totalProfit?.toFixed(2) || 0 }}%
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500">胜率</div>
                    <div class="text-lg font-semibold">
                      {{ calculationResult.stats?.winRate?.toFixed(2) || 0 }}%
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500">交易次数</div>
                    <div class="text-lg font-semibold">
                      {{ calculationResult.stats?.totalTransactions || 0 }}
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-gray-500">平均收益</div>
                    <div class="text-lg font-semibold" :class="calculationResult.stats?.avgProfit > 0 ? 'text-green-600' : 'text-red-600'">
                      {{ calculationResult.stats?.avgProfit?.toFixed(2) || 0 }}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div v-else class="text-center text-gray-500 py-4">
              暂无计算结果数据
            </div>
          </div>
          
          <!-- 分隔线 -->
          <div class="border-t border-gray-300 my-3"></div>
          
          <!-- 下半部分：计算队列展示区 -->
          <div class="bg-gray-50 p-3 rounded-md flex-grow overflow-y-auto">
            <h4 class="font-medium text-gray-700 mb-2">计算队列</h4>
            <CalculationQueueStatus ref="queueStatus" @result-updated="updateCalculationResult" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, defineProps, defineEmits, computed, onMounted } from 'vue'
import AlgorithmConfig from './AlgorithmConfig.vue'
import CalculationQueueStatus from '~/components/CalculationQueueStatus.vue'

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
  buyAlgorithm: {
    type: Array,
    default: () => []
  },
  // 卖出算法
  sellAlgorithm: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits([
  'update:ma',
  'update:buyAlgorithm',
  'update:sellAlgorithm',
  'pageCalculation',
  'globalCalculation'
])

// 本地响应式状态
const activeTab = ref('config') // 当前激活的标签页，默认为配置规则
const calculationResult = ref(null) // 计算结果
const queueStatus = ref(null) // 队列状态引用

// 更新计算结果
function updateCalculationResult(result) {
  calculationResult.value = result
  // 如果有新结果且不在队列标签页，可以考虑添加一个通知或提示
}

// 格式化日期（带时间）
function formatDateTime(timestamp) {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}
function updateBuyAlgorithm(newValue) {
  emit('update:buyAlgorithm', newValue)
}

function updateSellAlgorithm(newValue) {
  emit('update:sellAlgorithm', newValue)
}

// 计算按钮处理函数
function handlePageCalculation() {
  emit('pageCalculation', {
    ma: syncedMa.value,
    buyAlgorithm: props.buyAlgorithm,
    sellAlgorithm: props.sellAlgorithm
  })
}

function handleGlobalCalculation() {
  emit('globalCalculation', {
    ma: syncedMa.value,
    buyAlgorithm: props.buyAlgorithm,
    sellAlgorithm: props.sellAlgorithm
  })
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
</script>

<style scoped>
.tab-content {
  min-height: 0; /* 确保flex-grow生效 */
}
</style>