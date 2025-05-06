const MongoDB = require('../database/mongo');
const logger = require('../utils/logger');
const axios = require('axios');
const api = require('../../config/api');
const config = require('../../config/default');

/**
 * 列表数据获取模块
 * 负责获取加密货币列表数据
 */

/**
 * 获取加密货币列表数据
 * @returns {Promise<Array>} 加密货币列表数据
 */
async function fetchListPage() {
    try {
        const url = `${api.baseURL}${api.endpoints.allcoins}`;
        const params = {
            summary: true,  // 获取完整信息
        };
        
        const headers = {
            'authorization': `Apikey ${api.apiKey}`
        };

        logger.info(`正在请求 API: ${url}`);
        logger.info('请求参数:', params);
        logger.info('请求头:', headers);

        const response = await axios.get(url, { 
            headers,
            params
        });
        
        logger.info(`API 响应状态: ${response.status}`);
        logger.info('API 响应数据:', response.data);

        if (!response.data || !response.data.Data) {
            throw new Error('API 响应数据格式错误');
        }

        const mappedData = Object.values(response.data.Data).map(item => ({
            code: item.Symbol,
            name: item.FullName,
            market: 'crypto',
            dayLine: [],
            dayMetric: [],
            hourLine: [],
            hourMetric: [],
            signal: []
        }));

        logger.info(`成功获取加密货币列表数据，共 ${mappedData.length} 条记录`);
        return mappedData;
    } catch (error) {
        logger.error('获取加密货币列表失败:', error);
        logger.error('错误详情:', error.response ? error.response.data : '无响应数据');
        throw error;
    }
}

/**
 * 获取所有加密货币列表数据
 * @returns {Promise<Array>} 完整的加密货币列表数据
 */
async function fetchList() {
    try {
        const allData = await fetchListPage();
        
        // 保存到数据库
        if (allData.length > 0) {
            // await MongoDB.saveList(allData);
            await MongoDB.saveList(allData.filter(({code}) => config.stocks.includes(code)));
        }
        
        // 获取完整的列表
        const stockList = await MongoDB.getList();
        return stockList;
    } catch (error) {
        logger.error('获取加密货币列表失败:', error);
        throw error;
    }
}

module.exports = {
    fetchList,
    fetchListPage
};