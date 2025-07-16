import MongoDB from '../database/mongo.js';
import logger from '~/utils/logger.js';
import axios from 'axios';
import config from '../config/api.js';

/**
 * 小时线数据获取模块
 * 负责获取股票小时线行情数据
 */

/**
 * 从API获取单个股票的小时线数据
 * @param {string} stockCode - 股票代码
 * @returns {Promise<Array>} 原始小时线数据
 */
async function fetchHourLineFromAPI(stockCode) {
    const url = `${config.baseURL}${config.endpoints.histohour}`;
    const lastHourLine = await MongoDB.getLastHourLine(stockCode);
    let startTime;

    if (lastHourLine) {
        startTime = Math.floor(new Date(lastHourLine.time).getTime() / 1000);
    } else {
        // 如果没有小时线数据，则获取第一条日线数据作为起始时间点
        const firstDayLine = await MongoDB.getFirstDayLine(stockCode);
        if (firstDayLine) {
            startTime = Math.floor(new Date(firstDayLine.time).getTime() / 1000);
        }
    }

    const params = {
        fsym: stockCode,    // 交易对基础货币，如 BTC
        tsym: 'USD',        // 计价货币
        aggregate: 1,       // 不进行数据聚合
        e: 'CCCAGG',        // 使用综合数据
        limit: 2000         // 每次获取2000个数据点
    };

    const headers = {
        'authorization': `Apikey ${config.apiKey}`
    };

    let allData = [];
    let hasMoreData = true;
    let toTs = Math.floor(Date.now() / 1000); // 当前时间戳（秒）

    while (hasMoreData) {
        params.toTs = toTs;
        logger.info(`正在获取 ${stockCode} 的小时线数据`);
        logger.info('请求参数:', params);

        const response = await axios.get(url, { headers, params });

        if (!response.data || !response.data.Data || !response.data.Data.Data) {
            throw new Error('API 响应数据格式错误');
        }

        const data = response.data.Data.Data;
        if (data.length === 0) {
            hasMoreData = false;
        } else {
            allData = [...data, ...allData];
            
            // 如果已经获取到起始时间点，则停止
            if (startTime) {
                const oldestTime = data[0].time;
                if (oldestTime <= startTime) {
                    hasMoreData = false;
                    // 过滤掉重复的数据
                    allData = allData.filter(item => item.time > startTime);
                }
            }

            // 更新toTs为最早数据点的时间
            toTs = data[0].time;

            // 添加延迟，避免请求过于频繁
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    return allData;
}

/**
 * 转换小时线数据格式
 * @param {Array} rawData - 原始小时线数据
 * @returns {Array} 转换后的小时线数据
 */
function transformHourLineData(rawData) {
    return rawData
        .filter(item => item.high !== 0 && item.low !== 0 )
        .map(item => ({
        time: new Date(item.time * 1000),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volumefrom,
        amount: item.volumeto
    }));
}

/**
 * 获取单个股票的小时线数据
 * @param {string} stockCode - 股票代码
 * @returns {Promise<Array>} 小时线数据列表
 */
async function fetchHourLine(stockCode) {
    try {
        const rawData = await fetchHourLineFromAPI(stockCode);
        const hourLines = transformHourLineData(rawData);

        logger.info(`成功获取 ${stockCode} 的小时线数据，共 ${hourLines.length} 条记录`);

        // 保存到数据库
        await MongoDB.saveHourLine(stockCode, hourLines);
        
        return hourLines;
    } catch (error) {
        logger.error(`获取 ${stockCode} 小时线数据失败:`, error);
        throw error;
    }
}

/**
 * 检查股票是否需要更新小时线数据
 * @param {Object} stockInfo - 股票信息
 * @returns {boolean} 是否需要更新
 */
async function needsUpdate(stockCode) {
    const now = new Date();
    const lastHourLine = await MongoDB.getLastHourLine(stockCode);
    if (!lastHourLine) return true;

    const lastTime = new Date(lastHourLine.time);
    const diffHours = Math.floor((now - lastTime) / (1000 * 60 * 60));
    return diffHours >= 1; // 如果距离上次更新超过1小时，则需要更新
}

/**
 * 获取单个股票的最新小时线数据
 * @param {string} stockCode - 股票代码
 * @returns {Promise<void>}
 */
async function updateStockHourLine(stockCode) {
    try {
        await fetchHourLine(stockCode);
        // 添加延迟，避免请求过于频繁
        await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
        logger.error(`获取 ${stockCode} 小时线数据时出错:`, error);
        throw error;
    }
}

/**
 * 获取所有的小时线数据
 * 调用getList取得股票列表数据，循环调用fetchHourLine
 */
async function fetchAllHourLines() {
    try {
        // 获取加密货币列表
        const stockList = await MongoDB.getAll();
        logger.info(`开始获取所有加密货币的小时线数据，共 ${stockList.length} 个币种`);

        // 遍历每个币种
        let index = 1;
        for (const stock of stockList) {
            console.log(`${index}/${stockList.length}`);
            // 递增进度计数
            index++;
            try {
                // 检查是否需要更新
                if (!await needsUpdate(stock.code)) {
                    logger.info(`${stock.code} 已有最新小时数据，跳过更新`);
                    continue;
                }

                // 更新该币种的小时线数据
                await updateStockHourLine(stock.code);
            } catch (error) {
                logger.error(`获取 ${stock.code} 小时线数据时出错:`, error);
                // 继续处理下一个币种
                continue;
            }
        }

        logger.info('所有加密货币小时线数据获取完成');
    } catch (error) {
        logger.error('获取所有小时线数据失败:', error);
        throw error;
    }
}

export {
    fetchHourLine,
    fetchAllHourLines
};