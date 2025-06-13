import {
  calculateDayMetric
} from './day.js'
import {
  calculateHourMetric
} from './hour.js'
function calculateSignals ({dayLine}) {
  const metrics = calculateDayMetric(dayLine)
  const signals = metrics.reduce((result, item, i) => {
    // 添加价格乘以成交量大于10万的条件
    if(i>0 && item.sign1 >=0 && metrics[i-1].sign1 < -50 && metrics[i-1].sign2 < 0.2 && (dayLine[i].close * dayLine[i].volume > 100000)) {
      return [
        ...result,
        {
        signalTime: dayLine[i].time,
        signalPrice: dayLine[i].close
      }]
    }
    return result
  }, [])
  return signals
  // 计算信号
};

function calculateBuySignal ({signalTime,hourLine}) {
  // 将 signalTime 转换为时间戳以便比较
  const signalTimestamp = new Date(signalTime).getTime()
  
  // 找到 signalTime 之后的第一个小时线数据点
  const buySignal = hourLine.find(item => {
    const itemTimestamp = new Date(item.time).getTime()
    return itemTimestamp > signalTimestamp
  })
  
  return buySignal
}

function calculateSellSignal ({buyTime, hourLine}) {
  // 计算小时线的移动平均线指标
  // const maLine = calculateHourMetric(hourLine)
  // 计算买入时间戳和两天后的时间戳
  const buyTimestamp = new Date(buyTime).getTime()
  const twoDaysLater = buyTimestamp + (480 * 60 * 60 * 1000)
  // 寻找符合条件的卖出信号
  const sellSignal = hourLine.find((item, i) => {
    const maLine = calculateHourMetric(hourLine)
    // 检查成交量条件
    const {volume} = item
    const {volumeMaS, volumeMaM, volumeMaL, volumeMaXL} = maLine[i]
    // 成交量需要大于所有移动平均线的4倍
    const isVolume = volumeMaS != null && volumeMaM != null && 
                    volumeMaL != null && volumeMaXL != null &&
                    volume > volumeMaS * 4 && volume > volumeMaM * 4 && 
                    volume > volumeMaL * 4 && volume > volumeMaXL * 4
    
    // 检查时间条件
    const itemTimestamp = new Date(item.time).getTime()
    return (itemTimestamp > buyTimestamp && isVolume) || itemTimestamp > twoDaysLater
  })
  // return sellSignal
  // 判断是否成功卖出（不是因为到达两天期限而卖出）
  const sellTimestamp = new Date(sellSignal.time).getTime()
  return {
    time: sellSignal.time,
    close: sellSignal.close,
    isSellSuccess: sellTimestamp<twoDaysLater
  }
}

function calculateBuyTransaction (props) {
  const buySignal = calculateBuySignal(props)
  return {
    buyTime: buySignal.time,
    buyPrice: buySignal.open
  }
}
function calculateSellTransaction (props) {
  const sellSignal = calculateSellSignal(props)
  // console.log(sellSignal)
  return {
    sellTime: sellSignal.time,
    sellPrice: sellSignal.close,
    isSellSuccess: sellSignal.isSellSuccess
  }
}

function calculateTransaction (props) {
  // 计算出信号所有hourLine的index
  const {signalTime, hourLine} = props
  const signalTimestamp = new Date(signalTime).getTime()
  const hourLineTimestamp = hourLine.map(item => new Date(item.time).getTime())
  const signalIndex = hourLineTimestamp.findIndex(item => {
    return item == signalTimestamp
  })
  if (signalIndex === -1) {
    return {}
  }
  // 计算出signal前200到后1440之间的hourLine
  const startIndex = Math.max(0, signalIndex - 200)
  const endIndex = Math.min(hourLine.length - 1, signalIndex + 1440)
  const filteredHourLine = hourLine.slice(startIndex, endIndex)
  
  // 计算买入相关逻辑
  const buyTransaction = calculateBuyTransaction({
    signalTime,
    hourLine: filteredHourLine
  })
  
  // 只有当buyPrice存在时才计算sell相关逻辑
  let sellTransaction = {}
  let profit = null
  
  if (buyTransaction.buyPrice) {
    sellTransaction = calculateSellTransaction({
      // signalTime,
      ...buyTransaction,
      hourLine: filteredHourLine
    })
    
    // 计算利润百分比
    if (sellTransaction.sellPrice) {
      profit = ((sellTransaction.sellPrice - buyTransaction.buyPrice) / buyTransaction.buyPrice) * 100
    }
  }
  
  return {
    ...buyTransaction,
    ...sellTransaction,
    profit
  }
}

function calculateTransactions({dayLine, hourLine}) {
  const signals = calculateSignals({dayLine})
  const transactions = signals.map((item, i) => {
    const transaction = calculateTransaction({...item, hourLine })
    console.log(transaction)
    return {
      ...item,
      ...transaction
    }
  })
  return transactions
}
export {
  calculateSignals,
  calculateTransaction,
  calculateTransactions
}