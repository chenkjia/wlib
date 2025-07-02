
<template>
  <div class="stock-detail">
    <div class="flex flex-col md:flex-row h-full">
      <!-- 左侧K线图 -->
      <div class="chart-wrapper md:w-2/3">
        <div class="chart-container" ref="chartContainer"></div>
        <div class="absolute top-2 right-2 z-20 flex flex-col items-end space-y-2">
          <div class="bg-gray-800 text-white p-2 rounded-md flex items-center">
            <label for="trendInterval" class="mr-2 text-sm">趋势间隔:</label>
            <div class="flex items-center">
              <input 
                id="trendInterval"
                v-model.number="trendInterval" 
                type="number" 
                min="1" 
                max="30" 
                class="w-12 bg-gray-700 text-white rounded-l px-1 py-0.5 text-sm" 
              />
              <button 
                class="bg-blue-600 hover:bg-blue-700 text-white rounded-r px-2 py-0.5 text-sm"
                @click="refreshChart"
              >
                确认
              </button>
            </div>
          </div>
          
          <div class="bg-gray-800 text-white p-2 rounded-md flex items-center">
            <label for="profitFilter" class="mr-2 text-sm">利润过滤(%):</label>
            <div class="flex items-center">
              <input 
                id="profitFilter"
                v-model.number="profitFilter" 
                type="number" 
                min="0" 
                step="0.1"
                class="w-14 bg-gray-700 text-white rounded-l px-1 py-0.5 text-sm" 
              />
              <button 
                class="bg-blue-600 hover:bg-blue-700 text-white rounded-r px-2 py-0.5 text-sm"
                @click="refreshChart"
              >
                确认
              </button>
            </div>
          </div>
          
          <div class="bg-gray-800 text-white p-2 rounded-md flex items-center">
            <label for="dailyProfitFilter" class="mr-2 text-sm">日均利润(%):</label>
            <div class="flex items-center">
              <input 
                id="dailyProfitFilter"
                v-model.number="dailyProfitFilter" 
                type="number" 
                min="0" 
                step="0.01"
                class="w-14 bg-gray-700 text-white rounded-l px-1 py-0.5 text-sm" 
              />
              <button 
                class="bg-blue-600 hover:bg-blue-700 text-white rounded-r px-2 py-0.5 text-sm"
                @click="refreshChart"
              >
                确认
              </button>
            </div>
          </div>
          <button 
            class="bg-gray-800 text-white p-2 rounded-md"
            @click="toggleFullScreen"
          >
            <i :class="isFullScreen ? 'icon-fullscreen-exit' : 'icon-fullscreen'"></i>
          </button>
        </div>
      </div>
      
      <!-- 右侧目标趋势 -->
      <div class="w-full md:w-1/3 p-4 bg-white rounded-lg shadow">
        <div class="mb-4">
          <h2 class="text-lg font-semibold">{{ stockCode }} 目标趋势 <span class="text-sm text-gray-500">(总数: {{ goals.length }})</span></h2>
        </div>
        <div v-if="loading" class="flex justify-center items-center h-64">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
        <div v-else-if="error" class="text-red-500 p-4">
          {{ error }}
        </div>
        <div v-else-if="goals.length === 0" class="text-gray-500 p-4">
          暂无目标趋势数据
        </div>
        
        <div v-else class="divide-y overflow-auto max-h-[calc(100vh-200px)]">
            <div 
              v-for="(goal, index) in goals" 
              :key="index"
              class="p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-200"
              @click="selectedGoal = goal"
              @mouseover="highlightGoalPoints(goal)"
              @mouseout="resetHighlight()"
              :class="{'bg-blue-50': selectedGoal && selectedGoal.id === goal.id}"
            >
              <div class="flex justify-between items-center mb-2">
                <div class="font-medium flex items-center space-x-2">
                  <span>{{ formatDate(goal.startTime) }}</span>
                  <span class="text-gray-400">→</span>
                  <span>{{ formatDate(goal.endTime) || '进行中' }}</span>
                </div>
                <div :class="getProfitClass(goal.profit)" class="text-lg font-bold">
                  {{ goal.profit !== null && goal.profit !== undefined ? `${goal.profit > 0 ? '+' : ''}${goal.profit.toFixed(2)}%` : '-' }}
                </div>
              </div>
              <div class="grid grid-cols-4 gap-2 text-sm text-gray-600">
                <div class="flex items-center">
                  <span class="mr-1">起始:</span>
                  <span class="font-medium">{{ goal.startPrice }}</span>
                </div>
                <div class="flex items-center">
                  <span class="mr-1">目标:</span>
                  <span class="font-medium">{{ goal.endPrice || '-' }}</span>
                </div>
                <div class="flex items-center">
                  <span class="mr-1">持续:</span>
                  <span class="font-medium">{{ goal.duration || '-' }}天</span>
                </div>
                <div class="flex items-center">
                  <span class="mr-1">日均:</span>
                  <span :class="getProfitClass(goal.dailyProfit)" class="font-medium">{{ goal.dailyProfit ? goal.dailyProfit.toFixed(2) + '%' : '-' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
 
    <!-- 目标趋势详情弹窗 -->
    <div v-if="selectedGoal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl w-11/12 max-w-4xl max-h-[90vh] overflow-auto">
        <div class="p-4 border-b flex justify-between items-center">
          <h3 class="text-lg font-bold">目标趋势详情</h3>
          <button @click="selectedGoal = null" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="p-6">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-md font-semibold mb-3 text-gray-700">起始信息</h4>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="font-medium text-gray-600">股票代码:</div>
                <div>{{ selectedGoal.stockCode }}</div>
                <div class="font-medium text-gray-600">开始时间:</div>
                <div>{{ formatDate(selectedGoal.startTime) }}</div>
                <div class="font-medium text-gray-600">开始价格:</div>
                <div>{{ selectedGoal.startPrice }}</div>
                <div class="font-medium text-gray-600">趋势类型:</div>
                <div>{{ selectedGoal.goalType === 'buy' ? '买入' : '卖出' }}</div>
              </div>
            </div>
            
            <div class="bg-gray-50 p-4 rounded-lg">
              <h4 class="text-md font-semibold mb-3 text-gray-700">结果信息</h4>
              <div class="grid grid-cols-2 gap-3 text-sm">
                <div class="font-medium text-gray-600">结束时间:</div>
                <div>{{ formatDate(selectedGoal.endTime) || '-' }}</div>
                <div class="font-medium text-gray-600">结束价格:</div>
                <div>{{ selectedGoal.endPrice || '-' }}</div>
                <div class="font-medium text-gray-600">持续天数:</div>
                <div>{{ selectedGoal.duration || '-' }} 天</div>
                <div class="font-medium text-gray-600">盈亏率:</div>
                <div :class="getProfitClass(selectedGoal.profit)" class="font-bold">
                  {{ selectedGoal.profit !== null && selectedGoal.profit !== undefined ? `${selectedGoal.profit > 0 ? '+' : ''}${selectedGoal.profit.toFixed(2)}%` : '-' }}
                </div>
                <div class="font-medium text-gray-600">日均盈亏:</div>
                <div :class="getProfitClass(selectedGoal.dailyProfit)" class="font-bold">
                  {{ selectedGoal.dailyProfit !== null && selectedGoal.dailyProfit !== undefined ? `${selectedGoal.dailyProfit > 0 ? '+' : ''}${selectedGoal.dailyProfit.toFixed(2)}%` : '-' }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="text-md font-semibold mb-3 text-gray-700">趋势描述</h4>
            <p class="text-sm text-gray-600">{{ selectedGoal.description || '无描述信息' }}</p>
          </div>
        </div>
      </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import * as echarts from 'echarts'

// 直接在组件中实现 dayLineFormat 函数，避免从服务器端导入
const dayLineFormat = (dayLine, n) => {
  // 计算出dayLine里每个数据的max和min,max为前后n天的high最大值,min为前后n天的low最小值
  const result = dayLine.map((item, i) => {
    const max = Math.max(...dayLine.slice(Math.max(0, i - n), Math.min(dayLine.length, i + n + 1)).map(item => item.high))
    const min = Math.min(...dayLine.slice(Math.max(0, i - n), Math.min(dayLine.length, i + n + 1)).map(item => item.low))
    return {
      ...item,
      max,
      min,
      // 趋势开始
      trendStart: min === item.low,
      // 趋势结束
      trendEnd: max === item.high
    }
  })
  return result
}

const route = useRoute()
const chartContainer = ref(null)
const isFullScreen = ref(false)
const goals = ref([])
const loading = ref(true)
const error = ref('')
const selectedGoal = ref(null)
const trendInterval = ref(14) // 默认趋势间隔为14天
const profitFilter = ref(0) // 默认利润过滤器为0，不过滤任何数据
const dailyProfitFilter = ref(0) // 默认日均利润过滤器为0，不过滤任何数据
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
  if (profit === null || profit === undefined) return '-'
  return `${profit > 0 ? '+' : ''}${profit.toFixed(2)}%`
}

// 保留此函数供用户实现
function calculateGoals(dayLine) {

  const tmp = dayLine.filter(item => item.trendStart || item.trendEnd)
  const goals = tmp.reduce((result, item, index) => {
    const next = tmp[index + 1]
    if (item.trendStart && next && next.trendEnd) {
      const duration = (new Date(next.time).getTime() - new Date(item.time).getTime()) / (1000 * 60 * 60 * 24)
      const profit = (next.high - item.low) / item.low * 100
      const dailyProfit = profit / duration
      
      // 应用过滤器：如果利润或日均利润小于过滤器值，则跳过此项
      if (profit < profitFilter.value || dailyProfit < dailyProfitFilter.value) {
        return result
      }
      
      // 为每个goal添加唯一标识符
      const goalId = item.time + '-' + next.time
      
      return [
        ...result,
        {
          id: goalId, // 添加唯一标识符
          startPrice: item.low,
          endPrice: next.high,
          goalType: item.low < next.high ? 'buy' : 'sell',
          startTime: item.time,
          endTime: next.time,
          profit,
          // 计算duration,time是Date格式,需要转换为毫秒
          duration,
          // 日均涨幅
          dailyProfit,
        }
      ]
    }
    return result
  }, [])
  console.log(goals)
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
  // 存储日期到索引的映射，用于高亮显示
  const dateToIndexMap = {}

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i]
    categoryData.push(item.date)
    values.push([item.open, item.close, item.low, item.high])
    volumes.push([i, item.volume, item.open > item.close ? 1 : -1])
    
    // 存储日期到索引的映射
    dateToIndexMap[item.date] = i
  }
  
  // 添加所有趋势点（恢复原来的逻辑，确保点能显示）
  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i]
    
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
  
  // 如果有goals，为它们添加goalId，用于高亮显示
  if (goals.value && goals.value.length > 0) {
    goals.value.forEach(goal => {
      // 查找与goal.startTime和goal.endTime匹配的点
      const startPoint = trendStartPoints.find((point, idx) => {
        const date = rawData[point.coord[0]].time
        return date === goal.startTime
      })
      
      const endPoint = trendEndPoints.find((point, idx) => {
        const date = rawData[point.coord[0]].time
        return date === goal.endTime
      })
      
      // 为找到的点添加goalId
      if (startPoint) {
        startPoint.goalId = goal.id
      }
      
      if (endPoint) {
        endPoint.goalId = goal.id
      }
    })
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
  try {
    loading.value = true
    const response = await fetch(`/api/dayLine?code=${route.params.code}`)
    let rawData = await response.json()
    
    // 使用dayLineFormat处理数据，添加趋势标记
    rawData = dayLineFormat(rawData, trendInterval.value)
    
    // 重新计算目标趋势
    goals.value = calculateGoals(rawData)
    
    // 更新图表 - 注意顺序变化，先计算goals，再初始化图表
    await initChart(rawData, goals.value)
    
    loading.value = false
  } catch (err) {
    console.error('更新数据失败:', err)
    error.value = '更新数据失败: ' + err.message
    loading.value = false
  }
}

// 存储当前高亮的goalId
const currentHighlightGoalId = ref(null)

// 高亮显示目标点
function highlightGoalPoints(goal) {
  if (!myChart) return
  
  // 设置当前高亮的goalId
  currentHighlightGoalId.value = goal.id
  
  // 更新图表，触发高亮效果
  myChart.dispatchAction({
    type: 'highlight',
    seriesIndex: 0,
    dataIndex: [] // 这里不需要指定dataIndex，我们在markPoint中通过自定义itemStyle来高亮
  })
  
  // 重新设置图表选项，应用高亮效果
  myChart.setOption({
    series: [{
      name: 'K线',
      markPoint: {
        data: myChart.getOption().series[0].markPoint.data.map(point => {
          // 如果是当前高亮的goal，增加symbolSize和改变颜色
          if (point.goalId === currentHighlightGoalId.value) {
            return {
              ...point,
              symbolSize: 40, // 增大尺寸
              itemStyle: {
                color: point.itemStyle.color === '#1E90FF' ? '#00BFFF' : '#FF6347', // 稍微改变颜色
                shadowBlur: 10,
                shadowColor: '#fff'
              }
            }
          }
          return point
        })
      }
    }]
  })
}

// 重置高亮效果
function resetHighlight() {
  if (!myChart) return
  
  // 清除当前高亮的goalId
  currentHighlightGoalId.value = null
  
  // 更新图表，取消高亮效果
  myChart.dispatchAction({
    type: 'downplay',
    seriesIndex: 0
  })
  
  // 重新设置图表选项，恢复原始效果
  myChart.setOption({
    series: [{
      name: 'K线',
      markPoint: {
        data: myChart.getOption().series[0].markPoint.data.map(point => {
          return {
            ...point,
            symbolSize: 30, // 恢复原始尺寸
            itemStyle: {
              color: point.itemStyle.color === '#00BFFF' ? '#1E90FF' : '#FF4500' // 恢复原始颜色
            }
          }
        })
      }
    }]
  })
}

// 初始化图表
async function initChart(rawData) {
  try {
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
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: '#fff'
              }
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
  try {
    // 初始化图表
    myChart = echarts.init(chartContainer.value, 'dark')
    // 获取日线数据并计算目标趋势
    const response = await fetch(`/api/dayLine?code=${route.params.code}`)
    let rawData = await response.json()
    // 使用 dayLineFormat 处理数据
    rawData = dayLineFormat(rawData, trendInterval.value)

    // 计算目标趋势
    goals.value = calculateGoals(rawData)
    
    // 初始化图表
    await initChart(rawData, goals.value)
    
    loading.value = false
  } catch (err) {
    console.error('加载数据失败:', err)
    error.value = '加载数据失败: ' + err.message
    loading.value = false
  }

  // 添加窗口大小变化的监听器
  window.addEventListener('resize', handleResize)
})

// 监听趋势间隔变化，仅进行范围限制
watch(trendInterval, (newValue) => {
  if (newValue < 1) trendInterval.value = 1
  if (newValue > 30) trendInterval.value = 30
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