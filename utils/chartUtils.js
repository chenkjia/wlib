/**
 * 图表数据计算工具函数
 * 用于前端和服务器端共享的图表数据计算函数
 */

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
    if (i >= period - 1) {
      const sum = data.slice(i - period + 1, i + 1)
        .reduce((acc, cur) => acc + cur, 0);
      result.push(sum / period);
    } else {
      result.push(null);
    }
  }

  // 找到第一个非null值
  const firstNonNullValue = result.find(value => value !== null);
  
  const r = result.map(value => value ? value : firstNonNullValue)

  return r;
}

/**
 * 计算持仓方向
 * @param {Object} params - 输入参数对象
 * @param {Array<number>} params.maShort - 短期移动平均线数据
 * @param {Array<number>} params.maMiddle - 中期移动平均线数据
 * @param {Array<number>} params.maLong - 长期移动平均线数据
 * @returns {Array<number>} 持仓方向数组，1表示多头，-1表示空头，0表示无持仓
 */
export function calculatePosition({maShort, maMiddle, maLong}) {
  return maShort.map((short, index) => {
    if (short > maMiddle[index] && maMiddle[index] > maLong[index]) {
      return 1;
    } else if (short < maMiddle[index] && maMiddle[index] < maLong[index]) {
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
 * @param {Array<number>} params.maShort - 短期移动平均线数据
 * @param {Array<number>} params.maMiddle - 中期移动平均线数据
 * @param {Array<number>} params.maLong - 长期移动平均线数据
 * @returns {Array<number>} 均线离散度数组
 */
export function calculateSign2({maShort, maMiddle, maLong}) {
  return maShort.map((ma, index) => {
    const max = Math.max(ma, maMiddle[index], maLong[index])
    const min = Math.min(ma, maMiddle[index], maLong[index])
    return (max - min)/min
  })
}

/**
 * 计算日线技术指标
 * @param {Array<Object>} dayLine - 日线数据
 * @returns {Array<Object>} 包含技术指标的日线数据
 */
export function calculateDayMetric(dayLine) {
  if (!Array.isArray(dayLine) || dayLine.length === 0) {
      return [];
  }

  const dayClose = dayLine.map(item => item.close);
  const maShort = calculateMA(dayClose, 7);
  const maMiddle = calculateMA(dayClose, 50);
  const maLong = calculateMA(dayClose, 100);
  const position = calculatePosition({maShort, maMiddle, maLong})
  const sign1 = calculateSign1({position})
  const sign2 = calculateSign2({maShort, maMiddle, maLong})

  return dayLine.map((item, index) => ({
      date: item.date,
      maShort: maShort[index],
      maMiddle: maMiddle[index],
      maLong: maLong[index],
      position: position[index],
      sign1: sign1[index],
      sign2: sign2[index]
  }));
}

/**
 * 计算小时线技术指标
 * @param {Array<Object>} hourLine - 小时线数据
 * @returns {Array<Object>} 包含技术指标的小时线数据
 */
export function calculateHourMetric(hourLine) {
  if (!Array.isArray(hourLine) || hourLine.length === 0) {
      return [];
  }

  const hourClose = hourLine.map(item => item.close);
  const hourVolume = hourLine.map(item => item.volume);
  const maS = calculateMA(hourClose, 7);
  const maM = calculateMA(hourClose, 14);
  const maL = calculateMA(hourClose, 50);
  const maXL = calculateMA(hourClose, 100);
  const volumeMaS = calculateMA(hourVolume, 7);
  const volumeMaM = calculateMA(hourVolume, 14);
  const volumeMaL = calculateMA(hourVolume, 50);
  const volumeMaXL = calculateMA(hourVolume, 100);

  return hourLine.map((item, index) => ({
      time: item.time,
      maS: maS[index],
      maM: maM[index],
      maL: maL[index],
      maXL: maXL[index],
      volumeMaS: volumeMaS[index],
      volumeMaM: volumeMaM[index],
      volumeMaL: volumeMaL[index],
      volumeMaXL: volumeMaXL[index],
  }));
}

/**
 * 计算交易信号
 * @param {Object} params - 输入参数对象
 * @param {Array<Object>} params.dayLine - 日线数据
 * @returns {Array<Object>} 交易信号数组
 */
export function calculateSignals({dayLine}) {
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
}

/**
 * 计算买入信号
 * @param {Object} params - 输入参数对象
 * @param {string} params.signalTime - 信号时间
 * @param {Array<Object>} params.hourLine - 小时线数据
 * @returns {Object} 买入信号
 */
export function calculateBuySignal({signalTime, hourLine}) {
  // 将 signalTime 转换为时间戳以便比较
  const signalTimestamp = new Date(signalTime).getTime()
  
  // 找到 signalTime 之后的第一个小时线数据点
  const buySignal = hourLine.find(item => {
    const itemTimestamp = new Date(item.time).getTime()
    return itemTimestamp > signalTimestamp
  })
  
  return buySignal
}

/**
 * 计算卖出信号
 * @param {Object} params - 输入参数对象
 * @param {string} params.buyTime - 买入时间
 * @param {Array<Object>} params.hourLine - 小时线数据
 * @returns {Object} 卖出信号
 */
export function calculateSellSignal({buyTime, hourLine}) {
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
  // 判断是否成功卖出（不是因为到达两天期限而卖出）
  const sellTimestamp = new Date(sellSignal.time).getTime()
  return {
    time: sellSignal.time,
    close: sellSignal.close,
    isSellSuccess: sellTimestamp < twoDaysLater
  }
}

/**
 * 计算买入交易
 * @param {Object} props - 输入参数对象
 * @returns {Object} 买入交易信息
 */
export function calculateBuyTransaction(props) {
  const buySignal = calculateBuySignal(props)
  return {
    buyTime: buySignal.time,
    buyPrice: buySignal.open
  }
}

/**
 * 计算卖出交易
 * @param {Object} props - 输入参数对象
 * @returns {Object} 卖出交易信息
 */
export function calculateSellTransaction(props) {
  const sellSignal = calculateSellSignal(props)
  return {
    sellTime: sellSignal.time,
    sellPrice: sellSignal.close,
    isSellSuccess: sellSignal.isSellSuccess
  }
}

/**
 * 计算单个交易
 * @param {Object} props - 输入参数对象
 * @param {string} props.signalTime - 信号时间
 * @param {Array<Object>} props.hourLine - 小时线数据
 * @returns {Object} 交易信息
 */
export function calculateTransaction(props) {
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

/**
 * 计算多个交易
 * @param {Object} params - 输入参数对象
 * @param {Array<Object>} params.dayLine - 日线数据
 * @param {Array<Object>} params.hourLine - 小时线数据
 * @returns {Array<Object>} 交易信息数组
 */
export function calculateTransactions({dayLine, hourLine}) {
  const signals = calculateSignals({dayLine})
  const transactions = signals.map((item) => {
    const transaction = calculateTransaction({...item, hourLine })
    return {
      ...item,
      ...transaction
    }
  })
  return transactions
}