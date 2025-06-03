<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  signal: {
    type: Object,
    required: true
  }
})

const chartContainer = ref(null)
let myChart = null

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

// 格式化日期
function formatDate(dateInput) {
  if (!dateInput) return '';
  
  let date;
  if (typeof dateInput === 'string') {
    // 先尝试直接解析ISO格式
    if (dateInput.includes('T')) {
      return dateInput.split('T')[0];
    }
    
    // 尝试解析为日期对象
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return '';
  }
  
  // 检查日期是否有效
  if (isNaN(date.getTime())) {
    return '';
  }
  
  // 格式化为YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

// 格式化数据
function splitData(rawData) {
  const categoryData = []
  const values = []
  const volumes = []

  // 先按日期排序
  rawData.sort((a, b) => {
    const dateA = new Date(a.date || a.time);
    const dateB = new Date(b.date || b.time);
    return dateA - dateB;
  });

  for (let i = 0; i < rawData.length; i++) {
    const item = rawData[i];
    
    // 获取并格式化日期
    let dateStr = '';
    if (item.date) {
      dateStr = formatDate(item.date);
    } else if (item.time) {
      dateStr = formatDate(item.time);
    }
    
    // 跳过无效日期
    if (!dateStr) continue;
    
    categoryData.push(dateStr);
    values.push([item.open, item.close, item.low, item.high]);
    volumes.push([i, item.volume, item.open > item.close ? 1 : -1]);
  }

  return {
    categoryData,
    values,
    volumes
  }
}

// 初始化图表
async function initChart() {
  if (!props.signal || !props.signal._id) return
  
  try {
    // 使用新的API端点获取日线数据
    const response = await fetch(`/api/signals/dayLine/${props.signal._id}`)
    const responseData = await response.json()
    
    // 日线数据在 dayLine 字段中
    const rawData = responseData.dayLine
    if (!rawData || !rawData.length) {
      console.error('获取到的日线数据为空')
      return
    }
    
    const data = splitData(rawData)
    console.log('处理后的数据:', data.categoryData.length, '条记录')
    
    // 计算MA数据
    const ma7 = calculateMA(7, data.values)
    const ma50 = calculateMA(50, data.values)
    const ma100 = calculateMA(100, data.values)

    // 标记买入和卖出点
    const markPoints = []
    const buyDateStr = formatDate(props.signal.buyTime)
    console.log('买入日期:', buyDateStr, props.signal.buyTime)
    
    const buyIndex = data.categoryData.findIndex(date => date === buyDateStr)
    console.log('买入点索引:', buyIndex, '总数据点:', data.categoryData.length)
    
    if (buyIndex !== -1) {
      markPoints.push({
        name: '买入',
        coord: [buyIndex, data.values[buyIndex][1]],
        value: '买入',
        itemStyle: {
          color: '#2196F3'
        },
        symbol: 'pin',
        symbolSize: 50,
        label: {
          show: true,
          position: 'inside',
          formatter: '买入',
          fontSize: 12,
          color: '#fff'
        }
      })
    }

    if (props.signal.sellTime) {
      const sellDateStr = formatDate(props.signal.sellTime)
      console.log('卖出日期:', sellDateStr, props.signal.sellTime)
      
      const sellIndex = data.categoryData.findIndex(date => date === sellDateStr)
      console.log('卖出点索引:', sellIndex)
      
      if (sellIndex !== -1) {
        markPoints.push({
          name: '卖出',
          coord: [sellIndex, data.values[sellIndex][1]],
          value: '卖出',
          itemStyle: {
            color: props.signal.profit >= 0 ? upColor : downColor
          },
          symbol: 'pin',
          symbolSize: 50,
          label: {
            show: true,
            position: 'inside',
            formatter: '卖出',
            fontSize: 12,
            color: '#fff'
          }
        })
      }
    }

    // 配置项
    const option = {
      animation: false,
      legend: {
        top: 10,
        left: 'center',
        data: ['K线', 'MA7', 'MA50', 'MA100']
      },
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
        formatter: function (params) {
          const date = params[0].axisValue;
          let tooltipContent = `<div style="font-weight: bold; margin-bottom: 4px;">${date}</div>`;
          
          params.forEach(param => {
            if (param.seriesName === 'K线') {
              const color = param.value[1] >= param.value[0] ? upColor : downColor;
              tooltipContent += `<div style="color: ${color}">
                开盘: ${param.value[0].toFixed(2)}<br/>
                收盘: ${param.value[1].toFixed(2)}<br/>
                最低: ${param.value[2].toFixed(2)}<br/>
                最高: ${param.value[3].toFixed(2)}
              </div>`;
            } else if (param.seriesName === '成交量') {
              tooltipContent += `<div>成交量: ${param.value[1]}</div>`;
            } else if (param.value !== '-') {
              tooltipContent += `<div style="color: ${param.color}">${param.seriesName}: ${param.value}</div>`;
            }
          });
          
          return tooltipContent;
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
      toolbox: {
        feature: {
          dataZoom: {
            yAxisIndex: false
          },
          brush: {
            type: ['lineX', 'clear']
          }
        }
      },
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
          height: '50%'
        },
        {
          left: '10%',
          right: '8%',
          top: '65%',
          height: '25%'
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
          axisLabel: {
            formatter: function (value) {
              // 简化显示，只显示月-日
              const parts = value.split('-');
              if (parts.length === 3) {
                return `${parts[1]}-${parts[2]}`;
              }
              return value;
            }
          },
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
          start: 0,
          end: 100
        },
        {
          show: true,
          xAxisIndex: [0, 1],
          type: 'slider',
          top: '85%',
          start: 0,
          end: 100
        }
      ],
      series: [
        {
          name: 'K线',
          type: 'candlestick',
          data: data.values,
          markPoint: {
            data: markPoints,
            symbolSize: 30,
            label: {
              show: true,
              position: 'top',
              fontSize: 12
            },
            emphasis: {
              scale: true,
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            z: 10
          },
          itemStyle: {
            color: upColor,
            color0: downColor,
            borderColor: upColor,
            borderColor0: downColor
          }
        },
        {
          name: 'MA7',
          type: 'line',
          data: ma7,
          smooth: true,
          lineStyle: {
            opacity: 0.5,
            width: 1.5
          }
        },
        {
          name: 'MA50',
          type: 'line',
          data: ma50,
          smooth: true,
          lineStyle: {
            opacity: 0.5,
            width: 1.5
          }
        },
        {
          name: 'MA100',
          type: 'line',
          data: ma100,
          smooth: true,
          lineStyle: {
            opacity: 0.5,
            width: 1.5
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

    // 计算默认的缩放范围，如果有买入卖出点，则显示交易前后各20个交易日的范围
    if (buyIndex !== -1) {
      const totalDays = data.categoryData.length
      const sellIndex = props.signal.sellTime ? 
        data.categoryData.findIndex(date => date === formatDate(props.signal.sellTime)) : 
        -1
        
      const startIdx = Math.max(0, buyIndex - 20)
      const endIdx = sellIndex !== -1 ? Math.min(totalDays - 1, sellIndex + 20) : Math.min(totalDays - 1, buyIndex + 40)
      
      const startPercent = Math.max(0, Math.min(100, (startIdx / totalDays) * 100))
      const endPercent = Math.max(0, Math.min(100, (endIdx / totalDays) * 100))
      
      option.dataZoom[0].start = startPercent
      option.dataZoom[0].end = endPercent
      option.dataZoom[1].start = startPercent
      option.dataZoom[1].end = endPercent
    }

    myChart.setOption(option)
  } catch (error) {
    console.error('初始化图表失败:', error)
  }
}

onMounted(() => {
  if (chartContainer.value) {
    myChart = echarts.init(chartContainer.value, 'dark')
    initChart()
  }

  const handleResize = () => myChart?.resize()
  window.addEventListener('resize', handleResize)

  onUnmounted(() => {
    if (myChart) {
      myChart.dispose()
    }
    window.removeEventListener('resize', handleResize)
  })
})

watch(() => props.signal, () => {
  if (myChart) {
    initChart()
  }
}, { deep: true })
}, { deep: true })
</script>

<template>
  <div class="h-full flex flex-col overflow-hidden">    
    <!-- 股票K线图 -->
    <div class="flex-1 relative">
      <div ref="chartContainer" class="w-full h-full"></div>
    </div>
  </div>
</template>

<style scoped>
.chart-container {
  min-height: 400px;
}
</style> 