
// 算法工具函数

// 可用条件列表
const availableConditions = [
  // 短期与中期均线对比
  { 
    value: 'MAS_GT_MAM', 
    label: '短期均线高于中期均线', 
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i] > maM[i]
  },
  { 
    value: 'MAS_LT_MAM', 
    label: '短期均线低于中期均线',
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i] < maM[i]
  },
  { 
    value: 'MAS_CROSS_UP_MAM', 
    label: '短期均线上穿中期均线',
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i-1] < maM[i-1] && maS[i] >= maM[i]
  },
  { 
    value: 'MAS_CROSS_DOWN_MAM', 
    label: '短期均线下穿中期均线',
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i-1] > maM[i-1] && maS[i] <= maM[i]
  },
  
  // 中期与长期均线对比
  { 
    value: 'MAM_GT_MAL', 
    label: '中期均线高于长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i] > maL[i]
  },
  { 
    value: 'MAM_LT_MAL', 
    label: '中期均线低于长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i] < maL[i]
  },
  { 
    value: 'MAM_CROSS_UP_MAL', 
    label: '中期均线上穿长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i-1] < maL[i-1] && maM[i] >= maL[i]
  },
  { 
    value: 'MAM_CROSS_DOWN_MAL', 
    label: '中期均线下穿长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i-1] > maL[i-1] && maM[i] <= maL[i]
  },
  
  // 长期与超长期均线对比
  { 
    value: 'MAL_GT_MAX', 
    label: '长期均线高于超长期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i] > maX[i]
  },
  { 
    value: 'MAL_LT_MAX', 
    label: '长期均线低于超长期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i] < maX[i]
  },
  { 
    value: 'MAL_CROSS_UP_MAX', 
    label: '长期均线上穿超长期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i-1] < maX[i-1] && maL[i] >= maX[i]
  },
  { 
    value: 'MAL_CROSS_DOWN_MAX', 
    label: '长期均线下穿超长期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i-1] > maX[i-1] && maL[i] <= maX[i]
  },
  
  // 成交量相关
  { 
    value: 'VOLUME_HIGH', 
    label: '成交量放大',
    func: (i, {volume}) => volume[i] > volume[i-1] * 1.1
  },
  { 
    value: 'VOLUME_LOW', 
    label: '成交量缩小',
    func: (i, {volume}) => volume[i] < volume[i-1] * 0.9
  },
  
  // macd相关
  { 
    value: 'MACD_CROSS_UP_GOLDEN', 
    label: 'macd金叉',
    params: ['macd'],
    func: (i, {dif, dea}) => dif[i-1] < dea[i-1] && dif[i] >= dea[i] && (dea[i-1] <= 0 || Math.abs(dea[i-1]) < 0.05)
  },
  { 
    value: 'MACD_CROSS_DOWN_DEAD', 
    label: 'macd死叉',
    params: ['macd'],
    func: (i, {dif, dea}) => dif[i-1] > dea[i-1] && dif[i] <= dea[i] && (dea[i-1] >= 0 || Math.abs(dea[i-1]) < 0.05)
  },
  { 
    value: 'MACD_BOTTOM_DEVIATION', 
    label: 'macd底背离',
    params: ['macd'],
    func: (i, {dif, line}) => i > 2 && (line[i].low < line[i-1].low) && (dif[i] > dif[i-1]) && (dif[i] < 0)
  },
  { 
    value: 'MACD_TOP_DEVIATION', 
    label: 'macd顶背离',
    params: ['macd'],
    func: (i, {dif, line}) => i > 2 && (line[i].high > line[i-1].high) && (dif[i] < dif[i-1]) && (dif[i] > 0)
  },

  // kdj相关
  { 
    value: 'KDJ_OVERBOUGHT', 
    label: 'KDJ 超买（K、D > 80）',
    params: ['kdj'],
    func: (i, {kdjK, kdjD}) => kdjK[i] > 80 && kdjD[i] > 80
  },
  { 
    value: 'KDJ_OVERSOLD', 
    label: 'KDJ 超卖（K、D < 20）',
    params: ['kdj'],
    func: (i, {kdjK, kdjD}) => kdjK[i] < 20 && kdjD[i] < 20
  },

  // 其他指标
  { 
    value: 'SIGN1', 
    label: 'sign1小于50',
    params: ['ma'],
    func: (i, {sign1}) => sign1[i] < 50
  },
  { 
    value: 'MAS_UP', 
    label: '短期均线向上',
    params: ['ma'],
    func: (i, {maS}) => maS[i-2] < maS[i-1] && maS[i-1] < maS[i]
  },
  { 
    value: 'MAS_DOWN', 
    label: '短期均线向下',
    params: ['ma'],
    func: (i, {maS}) => maS[i-2] > maS[i-1] && maS[i-1] > maS[i]
  },
  { 
    value: 'MAM_UP', 
    label: '中期均线向上',
    params: ['ma'],
    func: (i, {maM}) => maM[i-2] < maM[i-1] && maM[i-1] < maM[i]
  },
  { 
    value: 'MAM_DOWN', 
    label: '中期均线向下',
    params: ['ma'],
    func: (i, {maM}) => maM[i-2] > maM[i-1] && maM[i-1] > maM[i]
  },
  { 
    value: 'MAL_UP', 
    label: '长期均线向上',
    params: ['ma'],
    func: (i, {maL}) => maL[i-2] < maL[i-1] && maL[i-1] < maL[i]
  },
  { 
    value: 'MAL_DOWN', 
    label: '长期均线向下',
    params: ['ma'],
    func: (i, {maL}) => maL[i-2] > maL[i-1] && maL[i-1] > maL[i]
  },
  { 
    value: 'MAX_UP', 
    label: '远期均线向上',
    params: ['ma'],
    func: (i, {maX}) => maX[i-2] < maX[i-1] && maX[i-1] < maX[i]
  },
  { 
    value: 'MAX_DOWN', 
    label: '远期均线向下',
    params: ['ma'],
    func: (i, {maX}) => maX[i-2] > maX[i-1] && maX[i-1] > maX[i]
  },
  { 
    value: 'MAS_UPTREND', 
    label: '短期均线拐头向上',
    params: ['ma'],
    func: (i, {maS}) => maS[i-2] > maS[i-1] && maS[i] > maS[i-1]
  },
  { 
    value: 'MAS_DOWNTREND', 
    label: '短期均线拐头向下',
    params: ['ma'],
    func: (i, {maS}) => maS[i-2] < maS[i-1] && maS[i] < maS[i-1]
  },
  { 
    value: 'MAM_UPTREND', 
    label: '中期均线拐头向上',
    params: ['ma'],
    func: (i, {maM}) => maM[i-2] > maM[i-1] && maM[i] > maM[i-1]
  },
  { 
    value: 'MAM_DOWNTREND', 
    label: '中期均线拐头向下',
    params: ['ma'],
    func: (i, {maM}) => maM[i-2] < maM[i-1] && maM[i] < maM[i-1]
  },
  { 
    value: 'MAL_UPTREND', 
    label: '长期均线拐头向上',
    params: ['ma'],
    func: (i, {maL}) => maL[i-2] > maL[i-1] && maL[i] > maL[i-1]
  },
  { 
    value: 'MAL_DOWNTREND', 
    label: '长期均线拐头向下',
    params: ['ma'],
    func: (i, {maL}) => maL[i-2] < maL[i-1] && maL[i] < maL[i-1]
  },
  { 
    value: 'MAX_UPTREND', 
    label: '远期均线拐头向上',
    params: ['ma'],
    func: (i, {maX}) => maX[i-2] > maX[i-1] && maX[i] > maX[i-1]
  },
  { 
    value: 'MAX_DOWNTREND', 
    label: '远期均线拐头向下',
    params: ['ma'],
    func: (i, {maX}) => maX[i-2] < maX[i-1] && maX[i] < maX[i-1]
  },
  { 
    value: 'MAS_EXPEND_MAM', 
    label: '短期均线扩大中期均线',
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i]-maS[i-1] > maM[i]-maM[i-1]
  },
  { 
    value: 'MAS_CONTRACT_MAM', 
    label: '短期均线缩小中期均线',
    params: ['ma'],
    func: (i, {maS, maM}) => maS[i]-maS[i-1] < maM[i]-maM[i-1]
  },
  { 
    value: 'MAM_EXPEND_MAL', 
    label: '中期均线扩大长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i]-maM[i-1] > maL[i]-maL[i-1]
  },
  { 
    value: 'MAM_CONTRACT_MAL', 
    label: '中期均线缩小长期均线',
    params: ['ma'],
    func: (i, {maM, maL}) => maM[i]-maM[i-1] < maL[i]-maL[i-1]
  },
  { 
    value: 'MAL_EXPEND_MAX', 
    label: '长期均线扩大远期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i]-maL[i-1] > maX[i]-maX[i-1]
  },
  { 
    value: 'MAL_CONTRACT_MAX', 
    label: '长期均线缩小远期均线',
    params: ['ma'],
    func: (i, {maL, maX}) => maL[i]-maL[i-1] < maX[i]-maX[i-1]
  },
]

// 创建algorithmMap对象，从availableConditions中提取函数
const algorithmMap = {}
availableConditions.forEach(condition => {
  algorithmMap[condition.value] = condition
})

// 条件树执行函数 - 使用algorithmMap优化性能
function evaluateConditionTree(node, data, index) {
  if (node.type === 'condition') {
    const condition = algorithmMap[node.value]
    return condition?.func(index, data) || false
  }
  
  if (node.type === 'group') {
    const results = node.children.map(child => 
      evaluateConditionTree(child, data, index)
    )
    
    switch (node.op) {
      case 'AND': return results.every(Boolean)
      case 'OR': return results.some(Boolean) 
      case 'NOT': return !results[0]
      default: return false
    }
  }
  
  return false
}

export { availableConditions, algorithmMap, evaluateConditionTree }