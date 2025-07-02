
<template>
  <div class="stock-detail">
    <div class="flex flex-col md:flex-row h-full">
      <!-- 左侧K线图 -->
      <div class="chart-wrapper md:w-2/3">
        <div class="chart-container" ref="chartContainer"></div>
        <div class="absolute top-2 right-2 z-20 flex items-center space-x-2">
          <div class="bg-gray-800 text-white p-2 rounded-md flex items-center">
            <label for="trendInterval" class="mr-2 text-sm">趋势间隔:</label>
            <input 
              id="trendInterval"
              v-model.number="trendInterval" 
              type="number" 
              min="1" 
              max="30" 
              class="w-12 bg-gray-700 text-white rounded px-1 py-0.5 text-sm" 
              @change="refreshChart"
            />
          </div>
          <button 
            class="bg-gray-800 text-white p-2 rounded-md"
            @click="toggleFullScreen"
          >
            <i :class="isFullScreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'"></i>
          </button>
        </div>
      </div>
      
      <!-- 右侧交易记录 -->
      <div class="w-full md:w-1/3 border-l overflow-auto">
        <div class="p-4 bg-gray-50 border-b">
          <h2 class="text-lg font-semibold">{{ stockCode }} 交易记录</h2>
        </div>
        
        <div v-if="loading" class="p-4 flex justify-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
        
        <div v-else-if="error" class="p-4 text-red-500">
          {{ error }}
        </div>
        
        <div v-else-if="goals.length === 0" class="p-4 text-gray-500 text-center">
          暂无交易记录
        </div>
        
        <div v-else class="divide-y">
          <div 
            v-for="goal in goals" 
            :key="transaction._id"
            class="p-4 hover:bg-gray-50 cursor-pointer transition"
            @click="selectedTransaction = transaction"
            :class="{'bg-blue-50': selectedTransaction && selectedTransaction._id === transaction._id}"
          >
            <div class="flex justify-between items-center mb-2">
              <div class="font-medium">买入时间: {{ formatDate(transaction.buyTime) }}</div>
              <div 
                :class="transaction.profit > 0 ? 'text-green-600' : transaction.profit < 0 ? 'text-red-600' : ''"
                class="font-bold"
              >
                {{ transaction.profit !== null && transaction.profit !== undefined ? `${transaction.profit > 0 ? '+' : ''}${transaction.profit.toFixed(2)}%` : '-' }}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div>买入价: {{ transaction.buyPrice }}</div>
              <div>卖出价: {{ transaction.sellPrice || '-' }}</div>
              <div>买入金额: {{ formatAmount(transaction.buyAmount) }}</div>
              <div>卖出状态: 
                <span :class="transaction.isSellSuccess ? 'text-green-600' : 'text-orange-500'">
                  {{ transaction.isSellSuccess !== undefined ? (transaction.isSellSuccess ? '成功' : '超时') : '-' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 交易详情弹窗 -->
    <div v-if="selectedTransaction" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-bold">交易详情</h3>
          <button @click="selectedTransaction = null" class="text-gray-500 hover:text-gray-700">
            <span class="text-2xl">&times;</span>
          </button>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <h4 class="font-semibold mb-2">买入信息</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="font-medium">股票代码:</div>
                <div>{{ selectedTransaction.stockCode }}</div>
                <div class="font-medium">买入时间:</div>
                <div>{{ formatDate(selectedTransaction.buyTime) }}</div>
                <div class="font-medium">买入价格:</div>
                <div>{{ selectedTransaction.buyPrice }}</div>
                <div class="font-medium">买入数量:</div>
                <div>{{ selectedTransaction.buyVolume }}</div>
                <div class="font-medium">买入金额:</div>
                <div>{{ formatAmount(selectedTransaction.buyAmount) }}</div>
              </div>
            </div>
            <div>
              <h4 class="font-semibold mb-2">卖出信息</h4>
              <div class="grid grid-cols-2 gap-2 text-sm">
                <div class="font-medium">卖出时间:</div>
                <div>{{ formatDate(selectedTransaction.sellTime) || '-' }}</div>
                <div class="font-medium">卖出价格:</div>
                <div>{{ selectedTransaction.sellPrice || '-' }}</div>
                <div class="font-medium">卖出数量:</div>
                <div>{{ selectedTransaction.sellVolume || '-' }}</div>
                <div class="font-medium">卖出金额:</div>
                <div>{{ formatAmount(selectedTransaction.sellAmount) }}</div>
                <div class="font-medium">盈亏:</div>
                <div :class="getProfitClass(selectedTransaction.profit)">
                  {{ formatProfit(selectedTransaction.profit) }}
                </div>
                <div class="font-medium">盈亏率:</div>
                <div :class="getProfitClass(selectedTransaction.profit)">
                  {{ formatProfitPercentage(selectedTransaction.profit) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { dayLineFormat } from '../server/strategies/calculate/goal'
import * as echarts from 'echarts'

const route = useRoute()
const chartContainer = ref(null)
const isFullScreen = ref(false)
const goals = ref([])
const loading = ref(true)
const error = ref('')
const selectedTransaction = ref(null)
const trendInterval = ref(5) // 默认趋势间隔为5天
let myChart = null

// 获取股票代码
const stockCode = computed(() => route.params.code)

// 切换全屏显示
function toggleFullScreen() {
  isFullScreen.value = !isFullScreen.value
  
  const chartWrapper = document.querySelector('.chart-wrapper')
  if (isFullScreen.value) {
    // 进入全屏模式
    chartWrapper.classList.add('fullscreen-mode')
    document.body.style.overflow = 'hidden'
  } else {
    // 退出全屏模式
    chartWrapper.classList.remove('fullscreen-mode')
    document.body.style.overflow = ''
  }
  
  // 调整图表大小
  setTimeout(() => {
    if (myChart) {
      myChart.resize()
    }
  }, 100)
}

// 格式化日期
function formatDate(dateString) {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化金额
function formatAmount(amount) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(amount)
}

// 获取盈亏样式类
function getProfitClass(profit) {
  if (!profit && profit !== 0) return ''
  return profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : ''
}

// 格式化盈亏
function formatProfit(profit) {
  if (profit === null || profit === undefined) return '-'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(profit)
}

// 格式化盈亏百分比
function formatProfitPercentage(profit) {
  if (profit === null || profit === undefined || !selectedTransaction.value) return '-'
  const percentage = (profit / selectedTransaction.value.buyAmount) * 100
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`
}

function calculateGoals(dayLine) {
  const goals = []
  return goals;
}

// 颜色配置
const upColor = '#00da3c'
const downColor = '#ec0000'

// 计算MA数据
function calculateMA(dayCount, data) {
  const result = []
  for (let i = 0, len = data.length; i < len; i++) {
    if (i < dayCount) {
      result.push('-')
      continue
    }
    let sum = 0
    for (let j = 0; j < dayCount; j++) {
      sum += data[i - j][1]
    }
    result.push((sum / dayCount).toFixed(3))
  }
  return result
}

// 格式化数据
function splitData(rawData) {
  const categoryData = []
  const values = []
  const volumes = []
  const trendStartPoints = []
  const trendEndPoints = []

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i]
    categoryData.push(item.date)
    values.push([item.open, item.close, item.low, item.high])
    volumes.push([i, item.volume, item.open > item.close ? 1 : -1])
    
    // 添加趋势开始和结束标记点
    if (item.trendStart) {
      trendStartPoints.push({
        coord: [i, item.low],
        value: '趋势开始',
        itemStyle: {
          color: '#1E90FF'
        }
      })
    }
    
    if (item.trendEnd) {
      trendEndPoints.push({
        coord: [i, item.high],
        value: '趋势结束',
        itemStyle: {
          color: '#FF4500'
        }
      })
    }
  }

  return {
    categoryData,
    values,
    volumes,
    trendStartPoints,
    trendEndPoints
  }
}

// 刷新图表
async function refreshChart() {
  if (myChart) {
    await initChart()
  }
}

// 初始化图表
async function initChart() {
  try {
    const response = await fetch(`/api/dayLine?code=${route.params.code}`)
    let rawData = await response.json()
    
    // 使用dayLineFormat处理数据，添加趋势标记
    rawData = dayLineFormat(rawData, trendInterval.value)
    
    const data = splitData(rawData)

    // 计算MA数据
    const ma7 = calculateMA(7, data.values)
    const ma50 = calculateMA(50, data.values)
    const ma100 = calculateMA(100, data.values)

    // 配置项
    const option = {
      animation: false,
      // 移除了legend

      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross'
        },
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 10,
        textStyle: {
          color: '#000'
        },
        position: function (pos, params, el, elRect, size) {
          const obj = {
            top: 10
          }
          obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30
          return obj
        }
      },
      axisPointer: {
        link: [{ xAxisIndex: 'all' }],
        label: {
          backgroundColor: '#777'
        }
      },
      // 移除了工具箱配置

      brush: {
        xAxisIndex: 'all',
        brushLink: 'all',
        outOfBrush: {
          colorAlpha: 0.1
        }
      },
      grid: [
        {
          left: '10%',
          right: '8%',
          height: '60%'
        },
        {
          left: '10%',
          right: '8%',
          top: '65%',
          height: '30%'
        }
      ],
      xAxis: [
        {
          type: 'category',
          data: data.categoryData,
          boundaryGap: false,
          axisLine: { onZero: false },
          splitLine: { show: false },
          min: 'dataMin',
          max: 'dataMax',
          axisPointer: {
            z: 100
          }
        },
        {
          type: 'category',
          gridIndex: 1,
          data: data.categoryData,
          boundaryGap: false,
          axisLine: { onZero: false },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          min: 'dataMin',
          max: 'dataMax'
        }
      ],
      yAxis: [
        {
          scale: true,
          splitArea: {
            show: true
          }
        },
        {
          scale: true,
          gridIndex: 1,
          splitNumber: 2,
          axisLabel: { show: false },
          axisLine: { show: false },
          axisTick: { show: false },
          splitLine: { show: false }
        }
      ],
      dataZoom: [
        {
          type: 'inside',
          xAxisIndex: [0, 1],
          start: 50,
          end: 100
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '85%',
          start: 50,
          end: 100
        }
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: data.values,
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: upColor,
            borderColor0: downColor
          },
          markPoint: {
            symbol: 'pin',
            symbolSize: 30,
            data: [
              ...data.trendStartPoints,
              ...data.trendEndPoints
            ],
            label: {
              formatter: '{b}',
              position: 'top',
              distance: 5,
              fontSize: 10
            }
          }
        },
        {
          name: 'MA7',
          type: 'line',
          data: ma7,
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        {
          name: 'MA50',
          type: 'line',
          data: ma50,
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        {
          name: 'MA100',
          type: 'line',
          data: ma100,
          smooth: true,
          lineStyle: {
            opacity: 0.5
          }
        },
        {
          name: '成交量',
          type: 'bar',
          xAxisIndex: 1,
          yAxisIndex: 1,
          data: data.volumes,
          itemStyle: {
            color: function (params) {
              return params.data[2] > 0 ? upColor : downColor
            }
          }
        }
      ]
    }

    myChart.setOption(option)
  } catch (error) {
    console.error('初始化图表失败:', error)
  }
}

onMounted(async () => {
  // 初始化图表
  myChart = echarts.init(chartContainer.value, 'dark')
  await initChart()
  goals = calculateGoals(data.values);

  // 添加窗口大小变化的监听器
  window.addEventListener('resize', handleResize)
})

// 监听趋势间隔变化
watch(trendInterval, async (newValue) => {
  if (newValue < 1) trendInterval.value = 1
  if (newValue > 30) trendInterval.value = 30
  await refreshChart()
})

const handleResize = () => {
  if (myChart) {
    myChart.resize()
  }
}

onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.stock-detail {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.chart-wrapper {
  position: relative;
  flex: 1;
  width: 100%;
  height: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  z-index: 10;
}

.relative {
  position: relative;
}

.absolute {
  position: absolute;
}

.top-2 {
  top: 0.5rem;
}

.right-2 {
  right: 0.5rem;
}

.z-20 {
  z-index: 20;
}

/* 全屏图标 */
.icon-fullscreen::before {
  content: '\2922';
  font-style: normal;
  font-size: 16px;
}

.icon-fullscreen-exit::before {
  content: '\2923';
  font-style: normal;
  font-size: 16px;
}

/* 全屏模式样式 */
.fullscreen-mode {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: white;
  z-index: 1000;
  padding: 10px;
}

.fullscreen-mode .chart-container {
  height: calc(100vh - 20px);
}

/* 交易记录样式 */
.bg-blue-50 {
  background-color: #eff6ff !important;
}

.text-green-600 {
  color: #059669;
}

.text-red-600 {
  color: #dc2626;
}

.text-orange-500 {
  color: #f97316;
}

.divide-y > * + * {
  border-top-width: 1px;
  border-top-style: solid;
  border-top-color: #e5e7eb;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .stock-detail {
    height: auto;
  }
  
  .chart-wrapper {
    height: 50vh;
  }
}
</style>