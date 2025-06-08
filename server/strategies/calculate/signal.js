import {
  calculateDayMetric
} from './day.js'
function calculateSignal ({dayLine, hourLine}) {
  const metrics = calculateDayMetric(dayLine)
  const signal = metrics.reduce((result, item, i) => {
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
  return {
    signal,
    metrics
  }
  // 计算信号
};
export {
  calculateSignal
}