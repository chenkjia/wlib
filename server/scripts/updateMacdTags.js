#!/usr/bin/env node

import MongoConnection from '../database/connection.js'
import MongoDB from '../database/mongo.js'
import logger from '~/utils/logger.js'
import { calculateEMA, aggregateDayToWeek } from '~/utils/chartUtils.js'

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

function normalizeLine(line = []) {
    if (!Array.isArray(line)) return []
    return [...line].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
}

function calculateMacdSeries(line = [], macdConfig = { s: 12, l: 26, d: 9 }) {
    const sorted = normalizeLine(line)
    const close = sorted.map(item => Number(item.close)).filter(Number.isFinite)
    if (close.length === 0) {
        return { dif: [], dea: [], bar: [], size: 0 }
    }
    const emaS = calculateEMA(close, macdConfig.s)
    const emaL = calculateEMA(close, macdConfig.l)
    const dif = emaS.map((ema, index) => ema - emaL[index])
    const dea = calculateEMA(dif, macdConfig.d)
    const bar = dif.map((lineValue, index) => lineValue - dea[index])
    return { dif, dea, bar, size: close.length }
}

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

function hasSecondGoldenCrossBelowZero(dif = [], dea = []) {
    const lastIndex = Math.min(dif.length, dea.length) - 1
    if (lastIndex < 1) return false
    const crossIndices = []
    for (let i = 1; i <= lastIndex; i++) {
        const isGoldenCross = dif[i - 1] <= dea[i - 1] && dif[i] > dea[i]
        const isBelowZero = dif[i] < 0 && dea[i] < 0
        if (isGoldenCross && isBelowZero) {
            crossIndices.push(i)
        }
    }
    if (crossIndices.length < 2) return false
    return crossIndices[crossIndices.length - 1] === lastIndex
}

function buildMacdTags({ dayLine = [], hourLine = [], macdConfig = { s: 12, l: 26, d: 9 }, dayLowThreshold = 0.15 }) {
    const tags = []
    const requiredK = Number(macdConfig.l) + Number(macdConfig.d) - 1
    const normalizedDayLine = normalizeLine(dayLine)
    const normalizedHourLine = normalizeLine(hourLine)
    const weekLine = aggregateDayToWeek(normalizedDayLine)
    const monthLine = aggregateDayToMonth(normalizedDayLine)

    const monthMacd = calculateMacdSeries(monthLine, macdConfig)
    const weekMacd = calculateMacdSeries(weekLine, macdConfig)
    const dayMacd = calculateMacdSeries(normalizedDayLine, macdConfig)
    const hourMacd = calculateMacdSeries(normalizedHourLine, macdConfig)

    const monthPair = getLastPair(monthMacd.dif, monthMacd.dea)
    if (monthMacd.size >= requiredK && Number.isFinite(monthPair.lastA) && monthPair.lastA > 0) {
        tags.push('macd_month_dif_above_zero')
    }

    const weekPair = getLastPair(weekMacd.dif, weekMacd.dea)
    if (weekMacd.size >= requiredK && Number.isFinite(weekPair.lastA) && Number.isFinite(weekPair.lastB) && weekPair.lastA > weekPair.lastB) {
        tags.push('macd_week_dif_above_dea')
    }

    const dayLastIndex = Math.min(dayMacd.dif.length, dayMacd.dea.length, dayMacd.bar.length) - 1
    if (dayMacd.size >= requiredK && dayLastIndex > 0) {
        const barLast = Number(dayMacd.bar[dayLastIndex])
        const barPrev = Number(dayMacd.bar[dayLastIndex - 1])
        const difLast = Number(dayMacd.dif[dayLastIndex])
        if (Number.isFinite(barLast) && Number.isFinite(barPrev) && barPrev < 0 && barLast > 0) {
            tags.push('macd_day_bar_green_to_red')
        }
        if (Number.isFinite(barLast) && Number.isFinite(barPrev) && barLast > 0 && barPrev >= 0 && barLast > barPrev) {
            tags.push('macd_day_red_bar_growing')
        }
        if (Number.isFinite(difLast) && difLast > 0 && difLast <= dayLowThreshold) {
            tags.push('macd_day_dif_above_zero_low_zone')
        }
    }

    if (hourMacd.size >= requiredK && hasSecondGoldenCrossBelowZero(hourMacd.dif, hourMacd.dea)) {
        tags.push('macd_hour_second_golden_cross_below_zero')
    }

    return tags
}

async function updateMacdTags() {
    const args = process.argv.slice(2)
    const dayLowThresholdArg = args.find(item => item.startsWith('--day-low-threshold='))
    const dayLowThreshold = dayLowThresholdArg ? Number(dayLowThresholdArg.split('=')[1]) : 0.15
    const macdConfig = { s: 12, l: 26, d: 9 }
    const stocks = await MongoDB.getStocksForMacdTagging()
    const tagDataList = stocks.map(stock => ({
        code: stock.code,
        macdTags: buildMacdTags({
            dayLine: stock.dayLine || [],
            hourLine: stock.hourLine || [],
            macdConfig,
            dayLowThreshold
        })
    }))
    const updateResult = await MongoDB.bulkUpdateMacdTags(tagDataList)
    const tagCounter = {}
    for (const item of tagDataList) {
        for (const tag of item.macdTags) {
            tagCounter[tag] = (tagCounter[tag] || 0) + 1
        }
    }
    return {
        totalStocks: tagDataList.length,
        updateResult,
        tagCounter
    }
}

async function main() {
    try {
        await MongoConnection.connect()
        const result = await updateMacdTags()
        console.log('\n=== MACD标签更新结果 ===')
        console.log(`处理股票数量: ${result.totalStocks}`)
        console.log(`匹配数量: ${result.updateResult.matchedCount}`)
        console.log(`更新数量: ${result.updateResult.modifiedCount}`)
        console.log('标签分布:')
        Object.entries(result.tagCounter).forEach(([tag, count]) => {
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

export { updateMacdTags, buildMacdTags }
