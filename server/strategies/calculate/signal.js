import {
  calculateDayMetric
} from './day.js'
function calculateSignals ({dayLine}) {
  const metrics = calculateDayMetric(dayLine)
  const signals = metrics.reduce((result, item, i) => {
    if(i>0 && item.sign1 >=0 && metrics[i-1].sign1 < -50 && metrics[i-1].sign2 < 0.2) {
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
  const buyTimestamp = new Date(buyTime).getTime()
  const sellSignal = hourLine.find(item => {
    const itemTimestamp = new Date(item.time).getTime()
    return itemTimestamp > buyTimestamp
  })
  
  return sellSignal
}
function calculateBuyTransaction ({signalTime,hourLine}) {
  const buySignal = calculateBuySignal({signalTime,hourLine})
  return {
    buyTime: buySignal.time,
    buyPrice: buySignal.open
  }
}
function calculateSellTransaction (props) {
  const sellSignal = calculateSellSignal(props)
  return {
    sellTime: sellSignal.time,
    sellPrice: sellSignal.close
  }
}

function calculateTransaction (props) {
  const buyTransaction = calculateBuyTransaction(props)
  
  // 只有当buyPrice存在时才计算sell相关逻辑
  let sellTransaction = {}
  let profit = null
  
  if (buyTransaction.buyPrice) {
    sellTransaction = calculateSellTransaction({...props, ...buyTransaction})
    
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
    return {
      ...item,
      ...transaction
    }
  })
  console.log(transactions)
  return transactions
}
export {
  calculateSignals,
  calculateTransaction,
  calculateTransactions
}