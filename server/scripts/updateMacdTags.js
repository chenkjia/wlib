#!/usr/bin/env node

import MongoConnection from '../database/connection.js'
import MongoDB from '../database/mongo.js'
import logger from '~/utils/logger.js'
import { calculateEMA, aggregateDayToWeek } from '~/utils/chartUtils.js'

// 将日线聚合为月线
function aggregateDayToMonth(dayLine = []) {
    if (!Array.isArray(dayLine) || dayLine.length === 0) return []
    const monthLine = []
    let currentMonth = null
    for (const day of dayLine) {
        const date = new Date(day.time)
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`
        if (!currentMonth || currentMonth.monthKey !== monthKey) {
            if (currentMonth) {
                monthLine.push(currentMonth.data)
            }
            currentMonth = {
                monthKey,
                data: {
                    time: day.time,
                    open: day.open,
                    high: day.high,
                    low: day.low,
                    close: day.close,
                    volume: day.volume || 0,
                    amount: day.amount || 0
                }
            }
        } else {
            currentMonth.data.time = day.time
            currentMonth.data.high = Math.max(currentMonth.data.high, day.high)
            currentMonth.data.low = Math.min(currentMonth.data.low, day.low)
            currentMonth.data.close = day.close
            currentMonth.data.volume += (day.volume || 0)
            currentMonth.data.amount += (day.amount || 0)
        }
    }
    if (currentMonth) {
        monthLine.push(currentMonth.data)
    }
    return monthLine
}

// 标准化K线顺序（按时间升序）
function normalizeLine(line = []) {
    if (!Array.isArray(line)) return []
    return [...line].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
}

// 计算单周期 MACD 序列，并返回与序列一一对应的时间轴
function calculateMacdSeries(line = [], macdConfig = { s: 12, l: 26, d: 9 }) {
    const sorted = normalizeLine(line)
    const validLine = sorted.filter(item => Number.isFinite(Number(item.close)))
    const close = validLine.map(item => Number(item.close))
    const times = validLine.map(item => item.time)
    if (close.length === 0) {
        return { dif: [], dea: [], bar: [], times: [], size: 0 }
    }
    const emaS = calculateEMA(close, macdConfig.s)
    const emaL = calculateEMA(close, macdConfig.l)
    const dif = emaS.map((ema, index) => ema - emaL[index])
    const dea = calculateEMA(dif, macdConfig.d)
    const bar = dif.map((lineValue, index) => lineValue - dea[index])
    return { dif, dea, bar, times, size: close.length }
}

// 获取两个序列的最新值和前一值
function getLastPair(seriesA = [], seriesB = []) {
    const lastIndex = Math.min(seriesA.length, seriesB.length) - 1
    if (lastIndex < 0) return { lastA: null, lastB: null, prevA: null, prevB: null }
    return {
        lastA: Number(seriesA[lastIndex]),
        lastB: Number(seriesB[lastIndex]),
        prevA: lastIndex > 0 ? Number(seriesA[lastIndex - 1]) : null,
        prevB: lastIndex > 0 ? Number(seriesB[lastIndex - 1]) : null
    }
}

// 判断是否出现“0轴下二次金叉”，且最近一次发生在最近 lookbackHours 小时内
function hasSecondGoldenCrossBelowZero(dif = [], dea = [], times = [], lookbackHours = 4) {
    const lastIndex = Math.min(dif.length, dea.length) - 1
    if (lastIndex < 1) return false
    const latestTime = new Date(times[lastIndex]).getTime()
    if (!Number.isFinite(latestTime)) return false
    const windowStart = latestTime - lookbackHours * 60 * 60 * 1000
    let belowZeroGoldenCrossCount = 0
    for (let i = 1; i <= lastIndex; i++) {
        const isGoldenCross = dif[i - 1] <= dea[i - 1] && dif[i] > dea[i]
        const isBelowZero = dif[i] < 0 && dea[i] < 0
        if (isGoldenCross && isBelowZero) {
            belowZeroGoldenCrossCount += 1
            if (belowZeroGoldenCrossCount >= 2) {
                const crossTime = new Date(times[i]).getTime()
                if (Number.isFinite(crossTime) && crossTime >= windowStart) {
                    return true
                }
            }
        }
    }
    return false
}

// 生成单只股票的 MACD 字段
function buildMacdFields({ dayLine = [], hourLine = [], macdConfig = { s: 12, l: 26, d: 9 }, dayLowThreshold = 0.15 }) {
    const dayTags = []
    const hourTags = []
    let macdTrendUpChannel = false
    const requiredK = Number(macdConfig.l) + Number(macdConfig.d) - 1
    const normalizedDayLine = normalizeLine(dayLine)
    const normalizedHourLine = normalizeLine(hourLine)
    const weekLine = aggregateDayToWeek(normalizedDayLine)
    const monthLine = aggregateDayToMonth(normalizedDayLine)

    const monthMacd = calculateMacdSeries(monthLine, macdConfig)
    const weekMacd = calculateMacdSeries(weekLine, macdConfig)
    const dayMacd = calculateMacdSeries(normalizedDayLine, macdConfig)
    const hourMacd = calculateMacdSeries(normalizedHourLine, macdConfig)

    // 月线：DIF 在 0 轴上方
    const monthPair = getLastPair(monthMacd.dif, monthMacd.dea)
    const weekPair = getLastPair(weekMacd.dif, weekMacd.dea)
    const monthDifAboveZero = monthMacd.size >= requiredK && Number.isFinite(monthPair.lastA) && monthPair.lastA > 0
    const weekDifAboveDea = weekMacd.size >= requiredK && Number.isFinite(weekPair.lastA) && Number.isFinite(weekPair.lastB) && weekPair.lastA > weekPair.lastB
    macdTrendUpChannel = monthDifAboveZero && weekDifAboveDea

    // 日线：绿柱翻红、红柱放大、DIF 在 0 轴上方低位
    const dayLastIndex = Math.min(dayMacd.dif.length, dayMacd.dea.length, dayMacd.bar.length) - 1
    if (dayMacd.size >= requiredK && dayLastIndex > 0) {
        const barLast = Number(dayMacd.bar[dayLastIndex])
        const barPrev = Number(dayMacd.bar[dayLastIndex - 1])
        const difLast = Number(dayMacd.dif[dayLastIndex])
        if (Number.isFinite(barLast) && Number.isFinite(barPrev) && barPrev < 0 && barLast > 0) {
            dayTags.push('macd_day_bar_green_to_red')
        }
        if (Number.isFinite(barLast) && Number.isFinite(barPrev) && barLast > 0 && barPrev >= 0 && barLast > barPrev) {
            dayTags.push('macd_day_red_bar_growing')
        }
        if (Number.isFinite(difLast) && difLast > 0 && difLast <= dayLowThreshold) {
            dayTags.push('macd_day_dif_above_zero_low_zone')
        }
    }

    // 小时线：0轴下二次金叉（最近4小时）
    if (hourMacd.size >= requiredK && hasSecondGoldenCrossBelowZero(hourMacd.dif, hourMacd.dea, hourMacd.times, 4)) {
        hourTags.push('macd_hour_second_golden_cross_below_zero')
    }

    return {
        macdTrendUpChannel,
        macdDayTags: dayTags,
        macdHourTags: hourTags
    }
}

// 全量更新所有股票的 MACD 标签
async function updateMacdTags() {
    const args = process.argv.slice(2)
    const dayLowThresholdArg = args.find(item => item.startsWith('--day-low-threshold='))
    const dayLowThreshold = dayLowThresholdArg ? Number(dayLowThresholdArg.split('=')[1]) : 0.15
    const macdConfig = { s: 12, l: 26, d: 9 }
    const stockCodes = await MongoDB.getStockCodesForMacdTagging()
    const totalStocks = stockCodes.length
    const fieldCounter = {
        macdTrendUpChannel: 0,
        macdDayTags: {},
        macdHourTags: {}
    }
    let matchedCount = 0
    let modifiedCount = 0
    for (let i = 0; i < totalStocks; i++) {
        const code = stockCodes[i].code
        const stock = await MongoDB.getStockLineForMacdTagging(code)
        if (!stock) {
            console.log(`[${i + 1}/${totalStocks}] ${code} 不存在，跳过`)
            continue
        }
        const macdFields = buildMacdFields({
            dayLine: stock.dayLine || [],
            hourLine: stock.hourLine || [],
            macdConfig,
            dayLowThreshold
        })
        const updateResult = await MongoDB.updateStock(stock.code, macdFields)
        matchedCount += updateResult.matchedCount || 0
        modifiedCount += updateResult.modifiedCount || 0
        if (macdFields.macdTrendUpChannel) {
            fieldCounter.macdTrendUpChannel += 1
        }
        for (const tag of macdFields.macdDayTags) {
            fieldCounter.macdDayTags[tag] = (fieldCounter.macdDayTags[tag] || 0) + 1
        }
        for (const tag of macdFields.macdHourTags) {
            fieldCounter.macdHourTags[tag] = (fieldCounter.macdHourTags[tag] || 0) + 1
        }
        console.log(`[${i + 1}/${totalStocks}] ${stock.code} 字段计算并保存完成，趋势:${macdFields.macdTrendUpChannel ? '是' : '否'} 日线标签:${macdFields.macdDayTags.length} 小时标签:${macdFields.macdHourTags.length}`)
    }
    return {
        totalStocks,
        updateResult: {
            matchedCount,
            modifiedCount
        },
        fieldCounter
    }
}

// 命令行主入口
async function main() {
    try {
        await MongoConnection.connect()
        const result = await updateMacdTags()
        console.log('\n=== MACD标签更新结果 ===')
        console.log(`处理股票数量: ${result.totalStocks}`)
        console.log(`匹配数量: ${result.updateResult.matchedCount}`)
        console.log(`更新数量: ${result.updateResult.modifiedCount}`)
        console.log('上升通道数量:')
        console.log(`  macdTrendUpChannel: ${result.fieldCounter.macdTrendUpChannel}`)
        console.log('日线标签分布:')
        Object.entries(result.fieldCounter.macdDayTags).forEach(([tag, count]) => {
            console.log(`  ${tag}: ${count}`)
        })
        console.log('小时线标签分布:')
        Object.entries(result.fieldCounter.macdHourTags).forEach(([tag, count]) => {
            console.log(`  ${tag}: ${count}`)
        })
    } catch (error) {
        logger.error('更新MACD标签失败:', error)
        process.exit(1)
    } finally {
        await MongoConnection.disconnect()
    }
}

main().catch(error => {
    logger.error('程序执行失败:', error)
    process.exit(1)
})

// 导出供测试或复用
export { updateMacdTags, buildMacdFields }
