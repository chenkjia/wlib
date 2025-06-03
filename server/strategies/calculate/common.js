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
        .reduce((acc, cur) => acc + cur, 0);
      result.push(sum / period);
    } else {
      result.push(null);
    }
  }

  return result;
}
export {
    calculateMA
};