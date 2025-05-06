
const { calculateMA } = require('./calculate');

/** * 计算日线数据的移动平均线指标
 * @param {Array<Object>} dayLine - 日线历史行情数据
 * @returns {Array<Object>} 移动平均线指标数据，格式为[{date,maShort,maMiddle,maLong}]
 */
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

module.exports = {
    calculateMetric
};