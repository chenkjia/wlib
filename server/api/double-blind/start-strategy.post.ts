import MongoDB from '../../database/mongo.js'
import { Stock } from '../../database/models/stock.js'
import { aggregateDayToWeek, calculateMetric } from '~/utils/chartUtils.js'
import { algorithmMap, evaluateConditionTree } from '~/utils/algorithmUtils.js'

const HISTORY_BARS = 300
const TEST_BARS = 300
const MIN_VALID_BARS = HISTORY_BARS + TEST_BARS
const MAX_STOCK_TRIES = 5

function isTradableLine(line: any) {
  if (!line) return false
  const close = Number(line.close)
  const volume = Number(line.volume)
  return Number.isFinite(close) && close > 0 && Number.isFinite(volume) && volume > 0
}

function normalizeLine(line: any[] = []) {
  if (!Array.isArray(line)) return []
  return [...line]
    .filter(item => item?.time)
    .map(item => ({
      time: item.time,
      open: Number(item.open),
      high: Number(item.high),
      low: Number(item.low),
      close: Number(item.close),
      volume: Number(item.volume),
      amount: Number(item.amount)
    }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
}

function resolveForeFactorMap(adjustFactor: any[] = []) {
  const sorted = [...adjustFactor]
    .filter(item => item?.time)
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())

  let pointer = 0
  let currentFactor = 1
  return (time: string | Date) => {
    const ts = new Date(time).getTime()
    while (pointer < sorted.length && new Date(sorted[pointer].time).getTime() <= ts) {
      const next = Number(sorted[pointer].foreAdjustFactor ?? sorted[pointer].adjustfactor ?? 1)
      currentFactor = Number.isFinite(next) && next > 0 ? next : currentFactor
      pointer += 1
    }
    return currentFactor
  }
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function hasInvalidGroup(groups: any[] = []) {
  return groups.some((group) => {
    if (Array.isArray(group)) {
      return group.length === 0
    }
    if (group && typeof group === 'object') {
      if (group.type === 'group') {
        return !Array.isArray(group.children) || group.children.length === 0
      }
      if (group.type === 'condition') {
        return !group.value
      }
    }
    return false
  })
}

function buildDatasets(line: any[], indicatorConfig: any) {
  const dayLine = normalizeLine(line)
  const weekLine = aggregateDayToWeek(dayLine)
  // 与主页买点模拟器保持一致：hour 使用同一套数据
  const hourLine = dayLine
  const dayData = calculateMetric(dayLine, indicatorConfig)
  const weekData = calculateMetric(weekLine, indicatorConfig)
  const hourData = calculateMetric(hourLine, indicatorConfig)
  return { dayData, weekData, hourData }
}

function buildForwardAdjustedLine(line: any[] = [], adjustFactor: any[] = []) {
  const dayLine = normalizeLine(line)
  const getFactorAt = resolveForeFactorMap(adjustFactor || [])
  return dayLine.map((item) => {
    const factor = Number(getFactorAt(item.time)) || 1
    return {
      ...item,
      open: Number(item.open) * factor,
      high: Number(item.high) * factor,
      low: Number(item.low) * factor,
      close: Number(item.close) * factor
    }
  })
}

function evaluateGroupAtIndex(group: any, index: number, datasets: any) {
  const dayData = datasets.dayData
  const weekData = datasets.weekData
  const hourData = datasets.hourData
  const curDayTime = dayData?.data?.[index]?.time
  const targetTime = new Date(curDayTime).getTime()

  let weekIndex = -1
  if (weekData?.data) {
    for (let i = weekData.data.length - 1; i >= 0; i--) {
      if (new Date(weekData.data[i].time).getTime() <= targetTime) {
        weekIndex = i
        break
      }
    }
  }

  let hourIndex = -1
  if (hourData?.data) {
    const endOfDay = targetTime + 24 * 3600 * 1000 - 1
    for (let i = hourData.data.length - 1; i >= 0; i--) {
      if (new Date(hourData.data[i].time).getTime() <= endOfDay) {
        hourIndex = i
        break
      }
    }
  }

  if (Array.isArray(group)) {
    return group.every((conditionType) => {
      const cond = algorithmMap[conditionType]
      if (!cond || typeof cond.func !== 'function') return false
      try {
        return Boolean(cond.func(index, dayData))
      } catch {
        return false
      }
    })
  }

  if (group && typeof group === 'object') {
    return evaluateConditionTree(group, {
      datasets: {
        day: dayData,
        week: weekData,
        hour: hourData
      },
      indices: {
        day: index,
        week: weekIndex,
        hour: hourIndex
      }
    })
  }

  return false
}

function findSignalIndices(buyConditions: any[] = [], datasets: any) {
  if (!Array.isArray(buyConditions) || buyConditions.length === 0) return []
  if (hasInvalidGroup(buyConditions)) return []
  const dayLength = Array.isArray(datasets?.dayData?.data) ? datasets.dayData.data.length : 0
  const buyLength = buyConditions.length
  let buyStep = 0
  const signalIndices: number[] = []

  for (let index = 0; index < dayLength; index++) {
    if (buyStep < buyLength) {
      const matched = evaluateGroupAtIndex(buyConditions[buyStep], index, datasets)
      if (matched) {
        buyStep += 1
      }
      if (buyStep === buyLength) {
        signalIndices.push(index)
        buyStep = 0
      }
    }
  }

  return signalIndices
}

function normalizeEnabledIndicators(value: any) {
  const arr = Array.isArray(value) ? value : ['ma', 'macd', 'kdj', 'bias']
  return [...new Set(arr)]
}

function normalizeVolumeMa(value: any) {
  const s = Math.max(2, Number(value?.s) || 5)
  const l = Math.max(s, Number(value?.l) || 10)
  return { s, l }
}

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const buyConditions = Array.isArray(body?.buyConditions) ? body.buyConditions : []
  if (buyConditions.length === 0 || hasInvalidGroup(buyConditions)) {
    throw createError({
      statusCode: 400,
      message: '请先设置有效的买入策略条件'
    })
  }

  const indicatorConfig = {
    ma: body?.ma || { s: 24, m: 60, l: 120, x: 250 },
    macd: body?.macd || { s: 12, l: 26, d: 9 },
    kdj: body?.kdj || { n: 9, k: 3, d: 3 },
    bias: body?.bias || { s: 6, m: 12, l: 24 },
    volumeMa: normalizeVolumeMa(body?.volumeMa || { s: 5, l: 10 }),
    enabledIndicators: normalizeEnabledIndicators(body?.enabledIndicators)
  }

  await MongoDB.connect()
  const sampled = await Stock.aggregate([
    { $sample: { size: MAX_STOCK_TRIES } },
    {
      $project: {
        _id: 0,
        code: 1,
        name: 1,
        dayLine: 1,
        adjustFactor: 1
      }
    }
  ])

  for (let attempt = 0; attempt < sampled.length; attempt += 1) {
    const candidate = sampled[attempt]
    const rawLine = normalizeLine(Array.isArray(candidate?.dayLine) ? candidate.dayLine : [])
    if (rawLine.length < MIN_VALID_BARS) continue

    const tradableIndices: number[] = []
    for (let i = 0; i < rawLine.length; i += 1) {
      if (isTradableLine(rawLine[i])) tradableIndices.push(i)
    }
    if (tradableIndices.length < MIN_VALID_BARS) continue

    const tradablePosMap = new Map<number, number>()
    tradableIndices.forEach((rawIndex, pos) => tradablePosMap.set(rawIndex, pos))

    // 策略匹配口径与训练页展示一致：使用前复权后的序列计算信号
    const adjustedLineForSignal = buildForwardAdjustedLine(rawLine, candidate.adjustFactor || [])
    const datasets = buildDatasets(adjustedLineForSignal, indicatorConfig)
    const signalRawIndices = findSignalIndices(buyConditions, datasets)
    if (signalRawIndices.length === 0) continue

    const validSignalRawIndices = signalRawIndices.filter((rawIndex) => {
      const pos = tradablePosMap.get(rawIndex)
      if (typeof pos !== 'number') return false
      return pos >= HISTORY_BARS && pos + TEST_BARS <= tradableIndices.length
    })
    if (validSignalRawIndices.length === 0) continue

    const chosenSignalRawIndex = validSignalRawIndices[randomInt(0, validSignalRawIndices.length - 1)]
    const startPos = tradablePosMap.get(chosenSignalRawIndex) as number
    const selectedPositions = tradableIndices.slice(startPos - HISTORY_BARS, startPos + TEST_BARS)
    const afterTestPositions = tradableIndices.slice(startPos + TEST_BARS, startPos + TEST_BARS + 100)
    if (selectedPositions.length < MIN_VALID_BARS) continue
    const signalTime = rawLine[chosenSignalRawIndex]?.time || null

    const getFactorAt = resolveForeFactorMap(candidate.adjustFactor || [])
    const line = selectedPositions.map((sourceIndex) => {
      const item = rawLine[sourceIndex]
      return {
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        amount: item.amount,
        foreAdjustFactor: getFactorAt(item.time)
      }
    })
    const afterTestLine = afterTestPositions.map((sourceIndex) => {
      const item = rawLine[sourceIndex]
      return {
        time: item.time,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume,
        amount: item.amount,
        foreAdjustFactor: getFactorAt(item.time)
      }
    })

    return {
      stock: {
        code: candidate.code,
        name: candidate.name
      },
      historyBars: HISTORY_BARS,
      testBars: TEST_BARS,
      line,
      afterTestLine,
      signalTime,
      startTime: line[HISTORY_BARS]?.time || null,
      endTime: line[line.length - 1]?.time || null,
      mode: 'strategy'
    }
  }

  throw createError({
    statusCode: 404,
    message: '这个策略找不到训练数据'
  })
})
