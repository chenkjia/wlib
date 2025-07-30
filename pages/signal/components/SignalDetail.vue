<template>
  <div class="signal-detail">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import { getSmallerOrderValue, calculateHourMetric, calculateTransaction } from '../../../utils/chartUtils.js'
const props = defineProps({
  signal: {
    type: Object,
    required: true
  }
})

const chartContainer = ref(null)
const hourLine = ref([])
const hourMetric = ref([])
const transaction = ref(null) // 添加买入信号状态变量
let myChart = null

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

async function fetchHourLine(signal) {
  if (!signal) return
  const signalDate = new Date(signal.signalTime)
  const startTime = new Date(signalDate.getTime() - 100 * 24 * 60 * 60 * 1000)
  const endTime = new Date(signalDate.getTime() + 200 * 24 * 60 * 60 * 1000)
  const res = await fetch(`/api/hourLine?code=${signal.stockCode}&startTime=${startTime.toISOString()}&endTime=${endTime.toISOString()}`)
  hourLine.value = await res.json()
  console.log(hourLine)
  hourMetric.value = calculateHourMetric(hourLine.value, {})
  
  // 计算买入信号
  transaction.value = calculateTransaction({signalTime: signal.signalTime, hourLine: hourLine.value})
  console.log('信号:', transaction.value)
  
  console.log(maLine)
  renderChart()
}

function renderChart() {
  if (!chartContainer.value) return
  if (!myChart) {
    myChart = echarts.init(chartContainer.value, 'light')
  }
  const data = splitData(hourLine.value)
  const maData = hourMetric.value
  // 定位signalTime索引
  let signalIndex = 0
  let signalPrice = props.signal.signalPrice
  if (props.signal.signalTime) {
    signalIndex = data.findIndex(d => {
      // 精确到小时
      return d[0] && new Date(d[0]).getTime() === new Date(props.signal.signalTime).setMinutes(0,0,0)
    })
    if (signalIndex === -1) signalIndex = 0
  }
  // 计算初始缩放区间（以signalIndex为中心）
  let start = 0, end = 100
  if (data.length > 0) {
    const percent = data.length > 0 ? (signalIndex / data.length) * 100 : 0
    start = Math.max(0, percent - 10)
    end = Math.min(100, percent + 10)
  }
  console.log(signalPrice)
  console.log(data[signalIndex])
  const xData = data.map(d => d[0])
  // 准备买入信号点数据
  let markPointData = []
  if (transaction.value) {
    const buyIndex = data.findIndex(d => d[0] === transaction.value.buyTime)
    if (buyIndex !== -1) {
      markPointData.push({
        name: '买入点',
        symbol: 'arrow', 
        coord: [buyIndex, transaction.value.buyPrice * 49/50],
        value: transaction.value.buyPrice,
        itemStyle: {
          color: '#00da3c'
        }
      })
    }
    const sellIndex = data.findIndex(d => d[0] === transaction.value.sellTime)
    if (sellIndex !== -1) {
      markPointData.push({
        name: '卖出点',
        symbol: 'arrow',
        symbolRotate: 180,
        coord: [sellIndex, transaction.value.sellPrice * 51 / 50],
        value: transaction.value.sellPrice,
        itemStyle: {
          color: '#FF0000'
        }
      })
    }
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
        interval: () => getSmallerOrderValue(signalPrice)
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
        markLine: {
          symbol: 'none',
          lineStyle: { type: 'dashed', color: '#777', width: 1 },
          data: [
            signalIndex > 0 ? { xAxis: signalIndex } : null,
            { yAxis: signalPrice }
          ]
        },
        // 添加买入点标记
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
        data: maData.maS,
        xAxisIndex: 0,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { width: 1, color: '#FFA500' }
      },
      // maM
      {
        type: 'line',
        name: 'maM',
        data: maData.maM,
        xAxisIndex: 0,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { width: 1, color: '#FF7F32' }
      },
      // maL
      {
        type: 'line',
        name: 'maL',
        data: maData.maL,
        xAxisIndex: 0,
        yAxisIndex: 0,
        showSymbol: false,
        lineStyle: { width: 1, color: '#FF4C00' }
      },
      // maXL
      {
        type: 'line',
        name: 'maXL',
        data: maData.maXL,
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
        data: maData.volumeMaS,
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
        data: maData.volumeMaM,
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
        data: maData.volumeMaL,
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
        data: maData.volumeMaXL,
        xAxisIndex: 1,
        yAxisIndex: 1,
        showSymbol: false,
        lineStyle: { width: 1, color: '#FFD700' },
        tooltip: { show: true }
      }
    ]
  })
}

watch(() => props.signal, (newSignal) => {
  fetchHourLine(newSignal)
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
.chart-container {
  width: 100%;
  height: 100%;
  z-index: 10;
}
</style>