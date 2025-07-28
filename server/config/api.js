// CryptoCompare API configuration
const config = {
    // API key
    apiKey: 'ede6f22e0717552bf7336ccb2c6f230f60884198c1bf224b8a815810d63a2cf5',
    
    // API base URL
    baseURL: 'https://min-api.cryptocompare.com/data',

    // API endpoints
    endpoints: {
        price: '/price',          // 获取实时价格的端点
        histoday: '/v2/histoday', // 获取每日历史数据的端点
        histohour: '/v2/histohour', // 获取每小时历史数据的端点
        toplist: '/top/totalvolfull',  // 获取市值排行榜的端点
        allcoins: '/all/coinlist'
    }
};

export default config;