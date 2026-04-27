import MongoDB from '../../database/mongo.js'
import { Stock } from '../../database/models/stock.js'

const HISTORY_BARS = 300
const TEST_BARS = 300
const MIN_VALID_BARS = HISTORY_BARS + TEST_BARS
const MAX_TRIES = 80

function isTradableLine(line: any) {
  if (!line) return false
  const close = Number(line.close)
  const volume = Number(line.volume)
  return Number.isFinite(close) && close > 0 && Number.isFinite(volume) && volume > 0
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

export default defineEventHandler(async () => {
  await MongoDB.connect()

  for (let attempt = 0; attempt < MAX_TRIES; attempt += 1) {
    const sampled = await Stock.aggregate([
      { $sample: { size: 1 } },
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

    if (!Array.isArray(sampled) || sampled.length === 0) continue
    const candidate = sampled[0]
    const rawLine = Array.isArray(candidate.dayLine) ? candidate.dayLine : []
    if (rawLine.length < MIN_VALID_BARS) continue

    const tradableIndices: number[] = []
    for (let i = 0; i < rawLine.length; i += 1) {
      if (isTradableLine(rawLine[i])) tradableIndices.push(i)
    }
    if (tradableIndices.length < MIN_VALID_BARS) continue

    const minStartPos = HISTORY_BARS
    const maxStartPos = tradableIndices.length - TEST_BARS
    if (maxStartPos < minStartPos) continue

    const startPos = randomInt(minStartPos, maxStartPos)
    const selectedPositions = tradableIndices.slice(startPos - HISTORY_BARS, startPos + TEST_BARS)
    if (selectedPositions.length < MIN_VALID_BARS) continue

    const getFactorAt = resolveForeFactorMap(candidate.adjustFactor || [])
    const line = selectedPositions.map((sourceIndex) => {
      const item = rawLine[sourceIndex]
      return {
        time: item.time,
        open: Number(item.open),
        high: Number(item.high),
        low: Number(item.low),
        close: Number(item.close),
        volume: Number(item.volume),
        amount: Number(item.amount),
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
      startTime: line[HISTORY_BARS]?.time || null,
      endTime: line[line.length - 1]?.time || null
    }
  }

  throw createError({
    statusCode: 500,
    message: '未找到满足双盲测试条件的股票样本'
  })
})
