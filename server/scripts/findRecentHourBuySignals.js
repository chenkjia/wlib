#!/usr/bin/env node

import MongoConnection from '../database/connection.js'
import { Stock } from '../database/models/stock.js'
import { calculateEMA } from '~/utils/chartUtils.js'

function parseArgs(argv = []) {
  const args = new Set(argv)
  const getValue = (key, fallback) => {
    const found = argv.find(item => item.startsWith(`${key}=`))
    return found ? found.slice(key.length + 1) : fallback
  }
  return {
    help: args.has('-h') || args.has('--help'),
    source: getValue('--source', 'alib'),
    hours: Number(getValue('--hours', '4')),
    limit: Number(getValue('--limit', '400'))
  }
}

function showHelp() {
  console.log('用法: node --import ./loader.js server/scripts/findRecentHourBuySignals.js [选项]')
  console.log('选项:')
  console.log('  --source=alib|flib')
  console.log('  --hours=4')
  console.log('  --limit=400')
}

function calculateMacd(lines, macd = { s: 12, l: 26, d: 9 }) {
  const close = lines.map(item => Number(item?.close ?? 0))
  const emaS = calculateEMA(close, macd.s)
  const emaL = calculateEMA(close, macd.l)
  const dif = emaS.map((v, i) => v - emaL[i])
  const dea = calculateEMA(dif, macd.d)
  return { dif, dea }
}

function calculateMagicNine(lines = []) {
  const up = new Array(lines.length).fill(0)
  const down = new Array(lines.length).fill(0)
  for (let i = 4; i < lines.length; i++) {
    const close = Number(lines[i]?.close)
    const close4 = Number(lines[i - 4]?.close)
    if (!Number.isFinite(close) || !Number.isFinite(close4)) {
      continue
    }
    if (close > close4) {
      up[i] = up[i - 1] + 1
      down[i] = 0
    } else if (close < close4) {
      down[i] = down[i - 1] + 1
      up[i] = 0
    } else {
      up[i] = 0
      down[i] = 0
    }
  }
  return { up, down }
}

function getCrossY(prevDif, prevDea, curDif, curDea) {
  const prevGap = prevDif - prevDea
  const curGap = curDif - curDea
  const gapDelta = curGap - prevGap
  if (gapDelta === 0) {
    return (curDif + curDea) / 2
  }
  const t = Math.max(0, Math.min(1, -prevGap / gapDelta))
  return prevDif + t * (curDif - prevDif)
}

function findBuySignals(lines = [], hours = 4) {
  if (!Array.isArray(lines) || lines.length < 35) {
    return []
  }
  const { dif, dea } = calculateMacd(lines)
  const magicNine = calculateMagicNine(lines)
  const now = Date.now()
  const cutoff = now - hours * 60 * 60 * 1000
  const signals = []
  for (let i = 1; i < lines.length; i++) {
    const prevDif = dif[i - 1]
    const curDif = dif[i]
    const prevDea = dea[i - 1]
    const curDea = dea[i]
    if (![prevDif, curDif, prevDea, curDea].every(Number.isFinite)) {
      continue
    }
    const crossUp = prevDif < prevDea && curDif >= curDea
    if (!crossUp) {
      continue
    }
    const crossY = getCrossY(prevDif, prevDea, curDif, curDea)
    if (crossY > 0) {
      continue
    }
    const previousMagicNineDown = magicNine.down[i - 1] || 0
    if (previousMagicNineDown <= 9) {
      continue
    }
    const signalTime = new Date(lines[i].time).getTime()
    if (!Number.isFinite(signalTime) || signalTime < cutoff || signalTime > now) {
      continue
    }
    signals.push({
      index: i,
      time: lines[i].time,
      close: Number(lines[i].close),
      crossY,
      previousMagicNineDown
    })
  }
  return signals
}

async function run(options) {
  await MongoConnection.setDataSource(options.source)
  await MongoConnection.connect()
  const stocks = await Stock.find(
    {},
    {
      _id: 0,
      code: 1,
      name: 1,
      hourLine: { $slice: -options.limit }
    }
  ).sort({ code: 1 }).lean()
  const matched = []
  for (const stock of stocks) {
    const signals = findBuySignals(stock.hourLine || [], options.hours)
    if (signals.length === 0) {
      continue
    }
    const latestSignal = signals[signals.length - 1]
    matched.push({
      code: stock.code,
      name: stock.name || '',
      signalCount: signals.length,
      latestSignalTime: latestSignal.time,
      latestClose: latestSignal.close,
      latestCrossY: latestSignal.crossY,
      prevMagicNineDown: latestSignal.previousMagicNineDown
    })
  }
  matched.sort((a, b) => new Date(b.latestSignalTime).getTime() - new Date(a.latestSignalTime).getTime())
  console.log(JSON.stringify({
    source: options.source,
    hours: options.hours,
    scanned: stocks.length,
    matched: matched.length,
    items: matched
  }, null, 2))
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    showHelp()
    return
  }
  try {
    await run(options)
  } finally {
    await MongoConnection.disconnect()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
