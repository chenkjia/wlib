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

  return dayLine.map((item, index) => ({
      date: item.date,
      ma: {
        maShort: maShort[index],
        maMiddle: maMiddle[index],
        maLong: maLong[index]
      }
  }));
}
function calculateSignal () {
  // 计算信号
};

export {
    calculateMA,
    calculateMetric,
    calculateSignal
};