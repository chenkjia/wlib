<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import * as echarts from 'echarts'

// 接收配置参数
const props = defineProps({
  // 图表标题
  title: {
    type: String,
    default: '图表'
  },
  // 图表数据
  data: {
    type: Array,
    default: () => []
  },
  // 图表类型：line, bar, candlestick等
  chartType: {
    type: String,
    default: 'line'
  },
  // 图表配置选项
  options: {
    type: Object,
    default: () => ({})
  },
  // 数据映射配置
  dataMap: {
    type: Object,
    default: () => ({
      xField: 0,  // x轴字段索引
      yField: 1   // y轴字段索引
    })
  },
  // 图表颜色
  color: {
    type: String,
    default: '#10b981'
  }
})

// 图表相关引用和状态
const chartContainer = ref(null)
const chartInstance = ref(null)

// 暴露给父组件的方法 - 调整图表大小
const resize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

// 暴露给父组件的方法 - 销毁图表
const dispose = () => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
}

// 向父组件暴露方法
defineExpose({
  resize,
  dispose,
  getChartInstance: () => chartInstance.value
})

// 生成图表系列配置
function generateSeries(seriesData) {
  const series = []
  
  // 处理options.series中的配置
  const seriesOptions = Array.isArray(props.options.series) ? props.options.series : []
  
  // 遍历数据映射配置
  Object.keys(props.dataMap).forEach((seriesName, index) => {
    // 跳过xField和yField特殊字段
    if (seriesName === 'xField' || seriesName === 'yField') return
    
    const dataKey = props.dataMap[seriesName]
    const data = seriesData[dataKey] || []
    
    // 查找对应的系列配置
    const seriesOption = seriesOptions.find(s => s.name === seriesName) || {}
    
    // 创建系列配置
    series.push({
      name: seriesName,
      type: seriesOption.type || props.chartType,
      data: data,
      // 合并默认样式和自定义样式
      ...seriesOption
    })
  })
  
  // 如果没有系列配置，添加默认系列
  if (series.length === 0 && seriesData['default']) {
    series.push({
      name: props.title,
      type: props.chartType,
      data: seriesData['default'],
      itemStyle: {
        color: props.color
      }
    })
  }
  
  return series
}

// 渲染图表
function renderChart() {
  // 确保容器存在
  if (!chartContainer.value) return
  
  // 检查容器尺寸
  const containerRect = chartContainer.value.getBoundingClientRect()
  const containerWidth = containerRect.width
  const containerHeight = containerRect.height
  
  if (containerWidth <= 0 || containerHeight <= 0) {
    // 容器尺寸无效，延迟重试
    setTimeout(renderChart, 200)
    return
  }
  
  // 清理旧的图表实例
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = null
  }
  
  // 创建新的图表实例
  chartInstance.value = echarts.init(chartContainer.value)
  
  // 准备数据
  let xData = []
  let seriesData = {}
  
  // 检查数据格式
  if (props.data && typeof props.data === 'object') {
    // 处理多系列数据
    if (!Array.isArray(props.data)) {
      // 对象格式的多系列数据
      Object.keys(props.data).forEach(key => {
        if (Array.isArray(props.data[key])) {
          seriesData[key] = props.data[key]
          
          // 如果还没有提取x轴数据，从第一个系列提取
          if (xData.length === 0 && key === Object.keys(props.dataMap).find(k => props.dataMap[k] === key)) {
            xData = props.data[key].map(item => item[0])
          }
        }
      })
    } else {
      // 单系列数组数据
      xData = props.data.map(item => item[props.dataMap.xField])
      const yData = props.data.map(item => {
        // 如果是数组，直接返回对应索引的值
        if (Array.isArray(props.dataMap.yField)) {
          return props.dataMap.yField.map(field => item[field])
        }
        // 否则返回单个值
        return item[props.dataMap.yField]
      })
      seriesData['default'] = yData
    }
  }
  
  // 基础配置选项
  const baseOption = {
    title: {
      text: props.title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: xData,
      scale: true,
      boundaryGap: false,
      axisLine: { onZero: false },
      splitLine: { show: false }
    },
    yAxis: {
      scale: true,
      splitArea: {
        show: true
      }
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        show: true,
        type: 'slider',
        top: '90%',
        start: 0,
        end: 100
      }
    ],
    series: generateSeries(seriesData)
  }
  
  // 合并用户自定义选项
  const option = {
    ...baseOption,
    ...props.options,
    // 保留生成的series配置
    series: baseOption.series
  }
  
  // 设置图表选项
  chartInstance.value.setOption(option)
}

// 组件挂载时初始化
onMounted(() => {
  renderChart()
})

// 监听数据变化重新渲染
watch(() => [props.data, props.options], () => {
  renderChart()
}, { deep: true })

// 组件卸载时清理资源
onUnmounted(() => {
  dispose()
})
</script>

<template>
  <div class="chart-wrapper">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 200px;
  flex: 1;
}
</style>