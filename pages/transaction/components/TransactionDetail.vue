<template>
  <div class="transaction-detail">
    <div class="p-4 bg-white border-b">
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="col-span-2 md:col-span-1">
          <h2 class="text-lg font-semibold mb-2">交易信息</h2>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="font-medium">股票代码:</div>
            <div>{{ transaction.stockCode }}</div>
            
            <div class="font-medium">信号时间:</div>
            <div>{{ formatDate(transaction.signalTime) }}</div>
            
            <div class="font-medium">信号价格:</div>
            <div>{{ transaction.signalPrice }}</div>
            
            <div class="font-medium">买入时间:</div>
            <div>{{ formatDate(transaction.buyTime) }}</div>
            
            <div class="font-medium">买入价格:</div>
            <div>{{ transaction.buyPrice }}</div>
            
            <div class="font-medium">买入数量:</div>
            <div>{{ transaction.buyVolume }}</div>
            
            <div class="font-medium">买入金额:</div>
            <div>{{ formatAmount(transaction.buyAmount) }}</div>
          </div>
        </div>
        
        <div class="col-span-2 md:col-span-1">
          <h2 class="text-lg font-semibold mb-2">卖出信息</h2>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="font-medium">卖出时间:</div>
            <div>{{ formatDate(transaction.sellTime) || '-' }}</div>
            
            <div class="font-medium">卖出价格:</div>
            <div>{{ transaction.sellPrice || '-' }}</div>
            
            <div class="font-medium">卖出数量:</div>
            <div>{{ transaction.sellVolume || '-' }}</div>
            
            <div class="font-medium">卖出金额:</div>
            <div>{{ formatAmount(transaction.sellAmount) }}</div>
            
            <div class="font-medium">盈亏:</div>
            <div :class="getProfitClass(transaction.profit)">
              {{ formatProfit(transaction.profit) }}
            </div>
            
            <div class="font-medium">盈亏率:</div>
            <div :class="getProfitClass(transaction.profit)">
              {{ formatProfitPercentage(transaction.profit) }}
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getSmallerOrderValue } from '../../../server/utils/common.js'
import { calculateHourMetric } from '../../../server/strategies/calculate/hour.js'

const props = defineProps({
  transaction: {
    type: Object,
    required: true
  }
})

const chartContainer = ref(null)
const hourLine = ref([])
const maLine = ref([])
let myChart = null

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

function formatAmount(amount) {
  if (amount === null || amount === undefined) return '-'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(amount)
}

function getProfitClass(profit) {
  if (!profit && profit !== 0) return ''
  return profit > 0 ? 'text-green-600' : profit < 0 ? 'text-red-600' : ''
}

function formatProfit(profit) {
  if (profit === null || profit === undefined) return '-'
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2
  }).format(profit)
}

function formatProfitPercentage(profit) {
  if (profit === null || profit === undefined) return '-'
  const percentage = (profit / props.transaction.buyAmount) * 100
  return `${percentage > 0 ? '+' : ''}${percentage.toFixed(2)}%`
}

function splitData(rawData) {
  // 返回 [日期, open, close, low, high, volume] 结构
  return rawData.map(item => [
    item.time,
    item.open,
    item.close,
    item.low,
    item.high,
    item.volume
  ])
}

async function fetchHourLine(transaction) {
  if (!transaction) return
  const transactionDate = new Date(transaction.buyTime)
  const startTime = new Date(transactionDate.getTime() - 100 * 24 * 60 * 60 * 1000)
  const endTime = new Date(transactionDate.getTime() + 200 * 24 * 60 * 60 * 1000)
  const res = await fetch(`/api/hourLine?code=${transaction.stockCode}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`)
  hourLine.value = await res.json()
  maLine.value = calculateHourMetric(hourLine.value)
  renderChart()
}

function renderChart() {
  if (!chartContainer.value) return
  if (!myChart) {
    myChart = echarts.init(chartContainer.value, 'light')
  }
  const data = splitData(hourLine.value)
  const maData = maLine.value
  
  // 定位买入和卖出时间索引
  let buyIndex = 0
  let sellIndex = -1
  let buyPrice = props.transaction.buyPrice
  let sellPrice = props.transaction.sellPrice
  
  if (props.transaction.buyTime) {
    buyIndex = data.findIndex(d => {
      // 精确到小时
      return d[0] && new Date(d[0]).getTime() === new Date(props.transaction.buyTime).setMinutes(0,0,0)
    })
    if (buyIndex === -1) buyIndex = 0
  }
  
  if (props.transaction.sellTime) {
    sellIndex = data.findIndex(d => {
      // 精确到小时
      return d[0] && new Date(d[0]).getTime() === new Date(props.transaction.sellTime).setMinutes(0,0,0)
    })
  }
  
  // 计算初始缩放区间（以buyIndex为中心）
  let start = 0, end = 100
  if (data.length > 0) {
    const percent = data.length > 0 ? (buyIndex / data.length) * 100 : 0
    start = Math.max(0, percent - 10)
    end = Math.min(100, percent + 10)
  }
  
  const xData = data.map(d => d[0])
  
  // 准备买入卖出点数据
  let markPointData = []
  if (buyIndex !== -1) {
    markPointData.push({
      name: '买入点',
      symbol: 'arrow', 
      coord: [buyIndex, buyPrice * 49/50],
      value: buyPrice,
      itemStyle: {
        color: '#00da3c'
      }
    })
  }
  
  if (sellIndex !== -1) {
    markPointData.push({
      name: '卖出点',
      symbol: 'arrow',
      symbolRotate: 180,
      coord: [sellIndex, sellPrice * 51 / 50],
      value: sellPrice,
      itemStyle: {
        color: '#FF0000'
      }
    })
  }
  
  myChart.setOption({
    animation: false,
    legend: {
      data: ['maS', 'maM', 'maL', 'maXL', 'volumeMaS', 'volumeMaM', 'volumeMaL', 'volumeMaXL'],
      top: 0,
      left: 'center',
      icon: 'line',
      textStyle: { fontSize: 12 }
    },
    axisPointer: {
      link: [
        { xAxisIndex: [0, 1] }
      ],
      label: {
        show: false
      }
    },
    dataset: [{ source: data }],
    grid: [
      { left: 60, right: 20, top: 20, bottom: 120 },
      { left: 60, right: 20, height: 80, bottom: 40 }
    ],
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' },
      formatter: function (params) {
        // params 是数组，包含主图和副图的所有 series
        let obj = {};
        params.forEach(p => {
          obj[p.seriesName] = p.data;
          obj[p.seriesName + '_value'] = p.value;
        });
        // 主K线数据
        const d = params[0].data;
        const t = d[0];
        const date = new Date(t);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const h = String(date.getHours()).padStart(2, '0');
        // 量数据
        const volume = d[5];
        // 均线数据
        const maS = obj['maS_value'] ?? '';
        const maM = obj['maM_value'] ?? '';
        const maL = obj['maL_value'] ?? '';
        const maXL = obj['maXL_value'] ?? '';
        // 量均线
        const volumeMaS = obj['volumeMaS_value'];
        const volumeMaM = obj['volumeMaM_value'];
        const volumeMaL = obj['volumeMaL_value'];
        const volumeMaXL = obj['volumeMaXL_value'];

        // 判断是否全部大于
        let volumeStr = '成交量: ' + volume;
        if (
          volumeMaS != null && volumeMaM != null && volumeMaL != null && volumeMaXL != null &&
          volume > volumeMaS * 4 && volume > volumeMaM * 4 && volume > volumeMaL * 4 && volume > volumeMaXL * 4
        ) {
          volumeStr = '<span style="color:red">成交量: ' + volume + '</span>';
        }

        return [
          '时间: ' + `${y}-${m}-${day} ${h}:00`,
          '开盘: ' + d[1],
          '收盘: ' + d[2],
          '最低: ' + d[3],
          '最高: ' + d[4],
          volumeStr,
          `maS: ${maS}`,
          `maM: ${maM}`,
          `maL: ${maL}`,
          `maXL: ${maXL}`,
          `volumeMaS: ${volumeMaS ?? ''}`,
          `volumeMaM: ${volumeMaM ?? ''}`,
          `volumeMaL: ${volumeMaL ?? ''}`,
          `volumeMaXL: ${volumeMaXL ?? ''}`
        ].join('<br/>');
      }
    },
    xAxis: [
      {
        type: 'category',
        data: xData,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        splitLine: { show: false },
        min: 'dataMin',
        max: 'dataMax',
        axisLabel: {
          formatter: function (value) {
            if (!value) return ''
            const d = new Date(value)
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            const h = String(d.getHours()).padStart(2, '0')
            return `${y}-${m}-${day} ${h}`
          }
        },
        axisPointer: {
          label: {
            show: false,
          }
        },
        gridIndex: 0
      },
      {
        type: 'category',
        data: xData,
        gridIndex: 1,
        scale: true,
        boundaryGap: false,
        axisLine: { onZero: false },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        min: 'dataMin',
        max: 'dataMax',
        axisPointer: {
          label: {
            show: false,
          }
        },
      }
    ],
    yAxis: [
      {
        scale: true,
        splitArea: { show: true },
        gridIndex: 0,
        interval: () => getSmallerOrderValue(buyPrice)
      },
      {
        scale: true,
        gridIndex: 1,
        position: 'right',
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
        start: start,
        end: end
      },
      {
        show: true,
        xAxisIndex: [0, 1],
        type: 'slider',
        top: '90%',
        start: start,
        end: end
      }
    ],
    series: [
      {
        type: 'candlestick',
        name: '小时线',
        encode: { x: 0, y: [1, 2, 3, 4] },
        large: true,
        progressive: 5000,
        itemStyle: {
          color: '#00da3c',
          color0: '#ec0000',
          borderColor: '#00da3c',
          borderColor0: '#ec0000'
        },
        xAxisIndex: 0,
        yAxisIndex: 0,
        markPoint: {
          data: markPointData,
          symbolSize: 20,
          label: {
            formatter: '{b}\n{c}',
            position: 'top'
          }
        }
      },
      // maS
      {
        type: 'line',
        name: 'maS',
        data: xData.map((_, i) => maData[i]?.maS ?? null),
        xAxisIndex: 0,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { width: 1, color: '#39c5bb' }
      },
      // maM
      {
        type: 'line',
        name: 'maM',
        data: xData.map((_, i) => maData[i]?.maM ?? null),
        xAxisIndex: 0,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { width: 1, color: '#FF7F32' }
      },
      // maL
      {
        type: 'line',
        name: 'maL',
        data: xData.map((_, i) => maData[i]?.maL ?? null),
        xAxisIndex: 0,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { width: 1, color: '#FF4C00' }
      },
      // maXL
      {
        type: 'line',
        name: 'maXL',
        data: xData.map((_, i) => maData[i]?.maXL ?? null),
        xAxisIndex: 0,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { width: 1, color: '#D72600' }
      },
      {
        type: 'bar',
        name: '成交量',
        encode: { x: 0, y: 5 },
        xAxisIndex: 1,
        yAxisIndex: 1,
        itemStyle: {
          color: 'rgba(60,120,216,0.3)'
        }
      },
      // volumeMaS
      {
        type: 'line',
        name: 'volumeMaS',
        data: xData.map((_, i) => maData[i]?.volumeMaS ?? null),
        xAxisIndex: 1,
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: { width: 1, color: '#1E90FF' },
        tooltip: { show: true }
      },
      // volumeMaM
      {
        type: 'line',
        name: 'volumeMaM',
        data: xData.map((_, i) => maData[i]?.volumeMaM ?? null),
        xAxisIndex: 1,
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: { width: 1, color: '#00CED1' },
        tooltip: { show: true }
      },
      // volumeMaL
      {
        type: 'line',
        name: 'volumeMaL',
        data: xData.map((_, i) => maData[i]?.volumeMaL ?? null),
        xAxisIndex: 1,
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: { width: 1, color: '#32CD32' },
        tooltip: { show: true }
      },
      // volumeMaXL
      {
        type: 'line',
        name: 'volumeMaXL',
        data: xData.map((_, i) => maData[i]?.volumeMaXL ?? null),
        xAxisIndex: 1,
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: { width: 1, color: '#FFD700' },
        tooltip: { show: true }
      }
    ]
  })
}

watch(() => props.transaction, (newTransaction) => {
  fetchHourLine(newTransaction)
}, { immediate: true })

onMounted(() => {
  if (chartContainer.value) {
    myChart = echarts.init(chartContainer.value, 'light')
  }
})

onUnmounted(() => {
  if (myChart) {
    myChart.dispose()
  }
})
</script>

<style scoped>
.transaction-detail {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chart-container {
  flex: 1;
  width: 100%;
  z-index: 10;
}
</style>