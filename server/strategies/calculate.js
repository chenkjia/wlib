/**
 * 技术指标计算模块
 * 负责计算各类技术指标
 */

/**
 * 计算移动平均线
 * @param {Array<Object>} data - 历史行情数据
 * @param {number} period - 计算周期
 * @returns {Array<number>} 移动平均线数据
 */
function calculateMA(data, period) {
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i >= period - 1) {
      const sum = data.slice(i - period + 1, i + 1)
        .reduce((acc, cur) => acc + cur.close, 0);
      result.push(sum / period);
    } else {
      result.push(null);
    }
  }

  return result;
}

  
function calculateMetric(dayLine) {
  if (!Array.isArray(dayLine) || dayLine.length === 0) {
      return [];
  }

  const maShort = calculateMA(dayLine, 7);
  const maMiddle = calculateMA(dayLine, 50);
  const maLong = calculateMA(dayLine, 100);
  const position = calculatePosition({maShort, maMiddle, maLong})
  const sign1 = calculateSign1({position})
  const sign2 = calculateSign2({maShort, maMiddle, maLong})

  return dayLine.map((item, index) => ({
      date: item.date,
      metric: {
        maShort: maShort[index],
        maMiddle: maMiddle[index],
        maLong: maLong[index],
        position: position[index],
        sign1: sign1[index],
        sign2: sign2[index]
      }
  }));
}
/**
 * 计算持仓天数
 * @param {Object} params - 输入参数对象
 * @param {Array<number>} params.position - 持仓方向数组，1表示多头，-1表示空头，0表示无持仓
 * @returns {Array<number>} 持续持仓天数数组，正数表示多头天数，负数表示空头天数
 */
function calculateSign1({position}) {
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
function calculateSign2({maShort, maMiddle, maLong}) {
  return maShort.map((ma, index) => {
    const max = Math.max(ma, maMiddle[index], maLong[index])
    const min = Math.min(ma, maMiddle[index], maLong[index])
    return (max - min)/min
  })
}
  // 参数验证
function calculatePosition({maShort, maMiddle, maLong}) {
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
function calculateSignal (dayLine) {
  const metrics = calculateMetric(dayLine)
  const signal = metrics.reduce((result, item, i) => {
    if(i>0 && item.metric.sign1 >=0 && metrics[i-1].metric.sign1 < -50 && metrics[i-1].metric.sign2 < 0.2) {
      return [
        ...result,
        {
        signalTime: dayLine[i].time,
        signalPrice: dayLine[i].close
      }]
    }
    return result
  }, [])
  return {
    signal,
    metrics
  }
  // 计算信号
};

export {
    calculateMA,
    calculateMetric,
    calculateSignal
};