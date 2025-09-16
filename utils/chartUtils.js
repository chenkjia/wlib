/**
 * 图表数据计算工具函数
 * 用于前端和服务器端共享的图表数据计算函数
 */

import { algorithmMap } from './algorithmUtils.js'

/**
 * 获取较小数量级的值
 * @param {number} num - 输入数字
 * @returns {number} 较小数量级的值
 */
export function getSmallerOrderValue(num) {
  if (num === 0) return 0;
  
  const absNum = Math.abs(num);
  
  // 处理整数部分 >=1 的情况
  if (absNum >= 1) {
    // 获取最高位的数量级
    const magnitude = Math.floor(Math.log10(absNum));
    return Math.pow(10, magnitude);
  }
  
  // 处理纯小数的情况（整数部分为 0）
  else {
    // 转换为科学计数法字符串（如 0.001 → "1e-3"）
    const scientificStr = absNum.toExponential();
    // 提取指数部分（如 "1e-3" → -3）
    const exponent = parseInt(scientificStr.split('e')[1]);
    // 计算小一位的值（如 -3 → 10^(-4) = 0.0001）
    return Math.pow(10, exponent - 1);
  }
}

/**
 * 计算移动平均线
 * @param {Array<number>} data - 历史行情数据
 * @param {number} period - 计算周期
 * @returns {Array<number>} 移动平均线数据
 */
export function calculateMA(data, period) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const param = i >= period - 1 ? period : i + 1;
    const sum = data.slice(i - param + 1, i + 1)
      .reduce((acc, cur) => acc + cur, 0);
    result.push(sum / param);
  }
  return result;
}

/**
 * 计算持仓方向
 * @param {Object} params - 输入参数对象
 * @param {Array<number>} params.maS - 短期移动平均线数据
 * @param {Array<number>} params.maM - 中期移动平均线数据
 * @param {Array<number>} params.maL - 长期移动平均线数据
 * @returns {Array<number>} 持仓方向数组，1表示多头，-1表示空头，0表示无持仓
 */
export function calculatePosition({maS, maM, maL}) {
  return maS.map((short, index) => {
    if (short > maM[index] && maM[index] > maL[index]) {
      return 1;
    } else if (short < maM[index] && maM[index] < maL[index]) {
      return -1;
    } else {
      return 0;
    }
  });
}

/**
 * 计算持仓天数
 * @param {Object} params - 输入参数对象
 * @param {Array<number>} params.position - 持仓方向数组，1表示多头，-1表示空头，0表示无持仓
 * @returns {Array<number>} 持续持仓天数数组，正数表示多头天数，负数表示空头天数
 */
export function calculateSign1({position}) {
  // 参数验证
  if (!Array.isArray(position) || position.length === 0) {
    return [];
  }

  // 初始化结果数组
  const holdingDays = new Array(position.length).fill(null);
  holdingDays[0] = position[0];

  // 计算持续持仓天数
  for (let i = 1; i < position.length; i++) {
    const prevDays = holdingDays[i - 1];
    const currentPosition = position[i];

    if (prevDays > 0 && currentPosition > 0) {
      holdingDays[i] = prevDays + 1;
    } else if (prevDays < 0 && currentPosition < 0) {
      holdingDays[i] = prevDays - 1;
    } else {
      holdingDays[i] = currentPosition;
    }
  }

  return holdingDays;
}

/**
 * 计算均线离散度
 * @param {Object} params - 输入参数对象
 * @param {Array<number>} params.maS - 短期移动平均线数据
 * @param {Array<number>} params.maM - 中期移动平均线数据
 * @param {Array<number>} params.maL - 长期移动平均线数据
 * @returns {Array<number>} 均线离散度数组
 */
export function calculateSign2({maS, maM, maL}) {
  return maS.map((ma, index) => {
    const max = Math.max(ma, maM[index], maL[index])
    const min = Math.min(ma, maM[index], maL[index])
    return (max - min)/min
  })
}
// 计算均线趋势排列：判断四条均线是否呈现正向或负向排列，并统计连续天数
export function calculateTrendAlignment({maS, maM, maL, maX}) {
  const signals = maS.map((ma, index) => {
    if (ma>=maM[index] && maM[index]>=maL[index] && maL[index]>=maX[index]) {
      return 1
    }
    if (ma<=maM[index] && maM[index]<=maL[index] && maL[index]<=maX[index]) {
      return -1
    }
    return 0
  })
  
  // 计算连续天数
  const result = []
  for (let i = 0; i < signals.length; i++) {
    if (signals[i] === 0) {
      result[i] = 0
    } else if (i === 0) {
      result[i] = signals[i]
    } else {
      // 只有当前信号与前一个信号相同时才累加
      if (signals[i] === signals[i - 1] && result[i - 1] !== 0) {
        result[i] = result[i - 1] + signals[i]
      } else {
        result[i] = signals[i]
      }
    }
  }
  return result
}

/**
 * 计算技术指标
 * @param {Array<Object>} data - 数据
 * @returns {Array<Object>} 包含技术指标的日线数据
 */
export function calculateMetric(data, {s=7, m=50, l=100, x=200}) {
  if (!Array.isArray(data) || data.length === 0) {
      return [];
  }

  const close = data.map(item => item.close);
  const volume = data.map(item => item.volume);
  const maS = calculateMA(close, s);
  const maM = calculateMA(close, m);
  const maL = calculateMA(close, l);
  const maX = calculateMA(close, x);
  const position = calculatePosition({maS, maM, maL})
  const sign1 = calculateSign1({position})
  const sign2 = calculateSign2({maS, maM, maL})
  const trendAlignment = calculateTrendAlignment({maS, maM, maL, maX})
  const volumeMaS = calculateMA(volume, s);
  const volumeMaM = calculateMA(volume, m);
  const volumeMaL = calculateMA(volume, l);
  const volumeMaX = calculateMA(volume, x);
  return {
    line: data,
    data,
    maS,
    maM,
    maL,
    maX,
    position,
    sign1,
    sign2,
    trendAlignment,
    volumeMaS,
    volumeMaM,
    volumeMaL,
    volumeMaX,
  }
}

/**
 * 计算日线技术指标
 * @param {Array<Object>} dayLine - 日线数据
 * @returns {Array<Object>} 包含技术指标的日线数据
 */
export function calculateDayMetric(dayLine, {s=7, m=50, l=100, x=200} = {}) {
  return calculateMetric(dayLine, {s, m, l, x})
}

/**
 * 计算小时线技术指标
 * @param {Array<Object>} hourLine - 小时线数据
 * @returns {Array<Object>} 包含技术指标的小时线数据
 */
export function calculateHourMetric(hourLine, {
  s=7,
  m=14,
  l=50,
  x=100
} = {}) {
  return calculateMetric(hourLine, {s, m, l, x})
}

// /**
//  * 计算交易信号
//  * @param {Object} params - 输入参数对象
//  * @param {Array<Object>} params.dayLine - 日线数据
//  * @returns {Array<Object>} 交易信号数组
//  */
// export function calculateSignals({dayLine}, param = {}) {
//   const {sign1, sign2} = calculateDayMetric(dayLine, param)
//   const signals = sign1.reduce((result, item, i) => {
//     // 添加价格乘以成交量大于10万的条件
//     if(i>0 && sign1[i] >=0 && sign1[i-1] < -50 && sign2[i-1] < 0.2 && (dayLine[i].close * dayLine[i].volume > 100000)) {
//       return [
//         ...result,
//         {
//         signalTime: dayLine[i].time,
//         signalPrice: dayLine[i].close
//       }]
//     }
//     return result
//   }, [])
//   return signals
// }

// /**
//  * 计算买入信号
//  * @param {Object} params - 输入参数对象
//  * @param {string} params.signalTime - 信号时间
//  * @param {Array<Object>} params.hourLine - 小时线数据
//  * @returns {Object} 买入信号
//  */
// export function calculateBuySignal({signalTime, hourLine}) {
//   // 将 signalTime 转换为时间戳以便比较
//   const signalTimestamp = new Date(signalTime).getTime()
  
//   // 找到 signalTime 之后的第一个小时线数据点
//   const buySignal = hourLine.find(item => {
//     const itemTimestamp = new Date(item.time).getTime()
//     return itemTimestamp > signalTimestamp
//   })
  
//   return buySignal
// }

// /**
//  * 计算卖出信号
//  * @param {Object} params - 输入参数对象
//  * @param {string} params.buyTime - 买入时间
//  * @param {Array<Object>} params.hourLine - 小时线数据
//  * @returns {Object} 卖出信号
//  */
// export function calculateSellSignal({buyTime, hourLine}, param = {}) {
//   // 计算买入时间戳和两天后的时间戳
//   const buyTimestamp = new Date(buyTime).getTime()
//   const twoDaysLater = buyTimestamp + (480 * 60 * 60 * 1000)
//   // 寻找符合条件的卖出信号
//   const {
//     volumeMaS,
//     volumeMaM,
//     volumeMaL,
//     volumeMaX,
//   } = calculateHourMetric(hourLine, param)
//   const sellSignal = hourLine.find((item, i) => {
//     // 检查成交量条件
//     const {volume} = item
//     // 成交量需要大于所有移动平均线的4倍
//     const isVolume = volume > volumeMaS[i] * 4 && volume > volumeMaM[i] * 4 && 
//                     volume > volumeMaL[i] * 4 && volume > volumeMaX[i] * 4
//     // 检查时间条件
//     const itemTimestamp = new Date(item.time).getTime()
//     return (itemTimestamp > buyTimestamp && isVolume) || itemTimestamp > twoDaysLater
//   })
//   // 判断是否成功卖出（不是因为到达两天期限而卖出）
//   const sellTimestamp = new Date(sellSignal.time).getTime()
//   return {
//     time: sellSignal.time,
//     close: sellSignal.close,
//     isSellSuccess: sellTimestamp < twoDaysLater
//   }
// }

// /**
//  * 计算买入交易
//  * @param {Object} props - 输入参数对象
//  * @returns {Object} 买入交易信息
//  */
// export function calculateBuyTransaction(props) {
//   const buySignal = calculateBuySignal(props)
//   return {
//     buyTime: buySignal.time,
//     buyPrice: buySignal.open
//   }
// }

// /**
//  * 计算卖出交易
//  * @param {Object} props - 输入参数对象
//  * @returns {Object} 卖出交易信息
//  */
// export function calculateSellTransaction(props) {
//   const sellSignal = calculateSellSignal(props)
//   return {
//     sellTime: sellSignal.time,
//     sellPrice: sellSignal.close,
//     isSellSuccess: sellSignal.isSellSuccess
//   }
// }

// /**
//  * 计算单个交易
//  * @param {Object} props - 输入参数对象
//  * @param {string} props.signalTime - 信号时间
//  * @param {Array<Object>} props.hourLine - 小时线数据
//  * @returns {Object} 交易信息
//  */
// export function calculateTransaction(props) {
//   // 计算出信号所有hourLine的index
//   const {signalTime, hourLine} = props
//   const signalTimestamp = new Date(signalTime).getTime()
//   const hourLineTimestamp = hourLine.map(item => new Date(item.time).getTime())
//   const signalIndex = hourLineTimestamp.findIndex(item => {
//     return item == signalTimestamp
//   })
//   if (signalIndex === -1) {
//     return {}
//   }
//   // 计算出signal前200到后1440之间的hourLine
//   const startIndex = Math.max(0, signalIndex - 200)
//   const endIndex = Math.min(hourLine.length - 1, signalIndex + 1440)
//   const filteredHourLine = hourLine.slice(startIndex, endIndex)
  
//   // 计算买入相关逻辑
//   const buyTransaction = calculateBuyTransaction({
//     signalTime,
//     hourLine: filteredHourLine
//   })
  
//   // 只有当buyPrice存在时才计算sell相关逻辑
//   let sellTransaction = {}
//   let profit = null
  
//   if (buyTransaction.buyPrice) {
//     sellTransaction = calculateSellTransaction({
//       ...buyTransaction,
//       hourLine: filteredHourLine
//     })
    
//     // 计算利润百分比
//     if (sellTransaction.sellPrice) {
//       profit = ((sellTransaction.sellPrice - buyTransaction.buyPrice) / buyTransaction.buyPrice) * 100
//     }
//   }
  
//   return {
//     ...buyTransaction,
//     ...sellTransaction,
//     profit
//   }
// }

// /**
//  * 计算多个交易
//  * @param {Object} params - 输入参数对象
//  * @param {Array<Object>} params.dayLine - 日线数据
//  * @param {Array<Object>} params.hourLine - 小时线数据
//  * @returns {Array<Object>} 交易信息数组
//  */
// export function calculateTransactions({dayLine, hourLine}, param = {}) {
//   const signals = calculateSignals({dayLine}, param)
//   const transactions = signals.map((item) => {
//     const transaction = calculateTransaction({...item, hourLine }, param) 
//     return {
//       ...item,
//       ...transaction
//     }
//   })
//   return transactions
// }

export const calculateStock = (props) => {
  const { dayLine, hourLine, ma, buyConditions, sellConditions } = props
  const dayLineWithMetric = calculateDayMetric(dayLine, ma)
  const hourLineWithMetric = calculateHourMetric(hourLine, ma)
  const transactions =  calculateTransactions({
    dayLineWithMetric,
    hourLineWithMetric,
    buyConditions,
    sellConditions
  })
  return {
    dayLineWithMetric,
    hourLineWithMetric,
    transactions
  }
}

// calculateTransactions
// 需要计算买入信号和卖出信号,传入dayLine,hourLine
// 先计算信号
// 最后根据信号计算交易
export const calculateTransactions = (props) => {
  const signals = calculateSignals(props)
  // 根据信号生成交易记录
  const transactions = []
  let lastBuySignal = null

  signals.forEach(signal => {
    if (signal.type === 'buy') {
      lastBuySignal = signal
    } else if (signal.type === 'sell' && lastBuySignal) {
      // 计算这笔交易的收益
      const profit = ((signal.price - lastBuySignal.price) / lastBuySignal.price) * 100
      
      transactions.push({
        buyTime: lastBuySignal.time,
        buyPrice: lastBuySignal.price,
        sellTime: signal.time,
        sellPrice: signal.price,
        profit
      })
      
      lastBuySignal = null
    }
  })
  return transactions
}

// calculateSignals 
// 计算信号
// 传入含技术参数的dayLine, hourLine, 卖入算法组, 卖出算法组
// 计算dayLine和hourLine的技术参数
const calculateSignals = (props) => {
  const { 
    dayLineWithMetric,
    hourLineWithMetric,
    buyConditions,
    sellConditions
  } = props
  const buyLength = buyConditions.length
  const sellLength = sellConditions.length
  
  // 如果买入或卖出条件长度为0，或者其中包含空数组，则直接返回空数组
  if (buyLength === 0 || sellLength === 0 || buyConditions.some((item) => item.length === 0) || sellConditions.some((item) => item.length === 0)) {
    return []
  }
  console.log('sdf')
  
  let buyStep = 0,
    sellStep = 0,
    hold = false
  const signals = dayLineWithMetric.data.reduce((prev, cur, index) => {
    if (buyStep < buyLength && !hold) {
      const buyResult = buyConditions[buyStep].every((conditionType) => {
        console.log(conditionType)
        return algorithmMap[conditionType](index, dayLineWithMetric)
      })
      if (buyResult) {
        buyStep++
      }
      if (buyStep === buyLength) {
        hold = true
        buyStep = 0
        prev.push({
          time: cur.time,
          type: 'buy',
          price: cur.close
        })
      }
    }
    if (sellStep < sellLength && hold) {
      const sellResult = sellConditions[sellStep].every((conditionType) => {
        return algorithmMap[conditionType](index, dayLineWithMetric)
      })
      if (sellResult) {
        sellStep++
      }
      if (sellStep === sellLength) {
        sellStep = 0
        hold = false
        prev.push({
          time: cur.time,
          type: 'sell',
          price: cur.close
        })
      }
    }
    return prev
  }, [])
  
  return signals
}

// 算法组定义
// 默认买入算法组
const defaultBuyFunction = [
  // 连续50天 maL>maM>maS
  (i, dayLineWithMetric) => {
    if (i < 50) {
      return false
    }
    const {maS, maM, maL} = dayLineWithMetric
    return maS[i] > maM[i] && maM[i] > maL[i]
  },
  // maS>maM>maL
  (i, dayLineWithMetric) => {
    if (i < 50) {
      return false
    }
    const {maS, maM, maL} = dayLineWithMetric
    return maS[i] > maM[i] && maM[i] > maL[i]
  },
]
// 默认卖出算法组
const defaultSellFunction = [
  (i, dayLineWithMetric) => { 
    // 短期的量超过长期的量的3倍
    if (i < 50) {
      return false
    }
    const {volumeMaS, volumeMaL} = dayLineWithMetric
    // 判断短期成交量是否超过长期成交量的3倍
    return volumeMaS[i] > volumeMaL[i] * 3
  },
  //maS<maM
  (i, dayLineWithMetric) => {
    if (i < 50) {
      return false
    }
    const {maS, maM} = dayLineWithMetric
    return maS[i] < maM[i]
  },
]

// 获取当前使用的算法组，优先使用window上定义的，如果没有则使用默认的
// 现在支持二维数组格式的条件，例如[[{conditionType: 'MAS_GT_MAM'}], [{conditionType: 'MAM_GT_MAL'}]]
const getBuyFunction = () => {
  // 如果window上有buyConditions，使用它
  if (window.buyConditions) {
    return window.buyConditions
  }
  
  // 否则，使用默认的函数转换为条件格式
  // 为了兼容旧版本，将函数数组转换为条件数组
  return [
    // 每个函数转换为一个条件组
    // 由于旧版本是顺序执行所有函数，这里将所有函数放在一个条件组中
    defaultBuyFunction.map((_, index) => ({
      conditionType: `DEFAULT_BUY_${index}`,
      // 保留原始函数以便在checkConditions中使用
      originalFunction: defaultBuyFunction[index]
    }))
  ]
}

const getSellFunction = () => {
  // 如果window上有sellConditions，使用它
  if (window.sellConditions) {
    return window.sellConditions
  }
  
  // 否则，使用默认的函数转换为条件格式
  return [
    // 每个函数转换为一个条件组
    defaultSellFunction.map((_, index) => ({
      conditionType: `DEFAULT_SELL_${index}`,
      // 保留原始函数以便在checkConditions中使用
      originalFunction: defaultSellFunction[index]
    }))
  ]
}