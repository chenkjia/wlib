module.exports = {
    // CryptoCompare API密钥
    apiKey: '204cf4cbc903b811a7b03605f6ef39b938577a12207e11d9e8a87682101a76dd',

    // API基础URL (removed template literals)
    baseURL: 'https://min-api.cryptocompare.com/data',

    // API端点配置
    endpoints: {
        price: '/price',          // 获取实时价格的端点
        histoday: '/v2/histoday', // 获取每日历史数据的端点
        histohour: '/v2/histohour', // 获取每小时历史数据的端点
        toplist: '/top/totalvolfull',  // 获取市值排行榜的端点
        allcoins: '/all/coinlist'
    }
};