import MongoDB from '../database/mongo.js';
import logger from '../utils/logger.js';
import axios from 'axios';
import config from '../config/api.js';

/**
 * 日线数据获取模块
 * 负责获取股票日线行情数据
 */

/**
 * 从API获取单个股票的日线数据
 * @param {string} stockCode - 股票代码
 * @returns {Promise<Array>} 原始日线数据
 */
async function fetchDayLineFromAPI(stockCode) {
    const url = `${config.baseURL}${config.endpoints.histoday}`;
    const lastDayLine = await MongoDB.getLastDayLine(stockCode);

    const params = {
        fsym: stockCode,    // 交易对基础货币，如 BTC
        tsym: 'USD',        // 计价货币
        aggregate: 1,       // 不进行数据聚合
        e: 'CCCAGG'        // 使用综合数据
    };

    if (!lastDayLine) {
        params.allData = true;  // 如果没有历史数据，获取全部数据
    } else {
        // 计算从最后一条数据到今天的天数作为limit
        const lastDate = new Date(lastDayLine.date);
        const today = new Date();
        const diffDays = Math.ceil((today - lastDate) / (1000 * 60 * 60 * 24));
        params.limit = diffDays + 1;  // 多获取一天以确保数据连续性
    }

    const headers = {
        'authorization': `Apikey ${config.apiKey}`
    };

    logger.info(`正在获取 ${stockCode} 的日线数据`);
    logger.info('请求参数:', params);

    const response = await axios.get(url, { headers, params });

    if (!response.data || !response.data.Data || !response.data.Data.Data) {
        throw new Error('API 响应数据格式错误');
    }

    return response.data.Data.Data;
}

/**
 * 转换日线数据格式
 * @param {Array} rawData - 原始日线数据
 * @returns {Array} 转换后的日线数据
 */
function transformDayLineData(rawData) {
    return rawData
        .filter(item => item.high !== 0 && item.low !== 0 )
        .map(item => ({
        date: new Date(item.time * 1000).toISOString().split('T')[0],
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volumefrom,
        amount: item.volumeto
    }));
}

/**
 * 获取单个股票的日线数据
 * @param {string} stockCode - 股票代码
 * @returns {Promise<Array>} 日线数据列表
 */
async function fetchDayLine(stockCode) {
    try {
        const rawData = await fetchDayLineFromAPI(stockCode);
        const dayLines = transformDayLineData(rawData);

        logger.info(`成功获取 ${stockCode} 的日线数据，共 ${dayLines.length} 条记录`);

        // 保存到数据库
        await MongoDB.saveDayLine(stockCode, dayLines);
        
        return dayLines;
    } catch (error) {
        logger.error(`获取 ${stockCode} 日线数据失败:`, error);
        throw error;
    }
}

/**
 * 检查股票是否需要更新日线数据
 * @param {Object} stockInfo - 股票信息
 * @returns {boolean} 是否需要更新
 */
async function needsUpdate(stockCode) {
    const today = new Date().toISOString().split('T')[0];
    const lastDayLine = await MongoDB.getLastDayLine(stockCode);
    return !lastDayLine || lastDayLine.date !== today;
}

/**
 * 获取单个股票的最新日线数据
 * @param {string} stockCode - 股票代码
 * @returns {Promise<void>}
 */
async function updateStockDayLine(stockCode) {
    try {
        await fetchDayLine(stockCode);
        // 添加延迟，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        logger.error(`获取 ${stockCode} 日线数据时出错:`, error);
        throw error;
    }
}

/**
 * 获取所有的日线数据
 * 调用getList取得股票列表数据，循环调用fetchDayLine
 */
async function fetchAllDayLines() {
    try {
        // 获取加密货币列表
        const stockList = await MongoDB.getList();
        logger.info(`开始获取所有加密货币的日线数据，共 ${stockList.length} 个币种`);

        // 遍历每个币种
        for (const stock of stockList) {
            try {
                // 检查是否需要更新
                if (!await needsUpdate(stock.code)) {
                    logger.info(`${stock.code} 已有今日数据，跳过更新`);
                    continue;
                }

                // 更新该币种的日线数据
                await updateStockDayLine(stock.code);
            } catch (error) {
                logger.error(`获取 ${stock.code} 日线数据时出错:`, error);
                // 继续处理下一个币种
                continue;
            }
        }

        logger.info('所有加密货币日线数据获取完成');
    } catch (error) {
        logger.error('获取所有日线数据失败:', error);
        throw error;
    }
}

export { fetchDayLine, fetchAllDayLines };