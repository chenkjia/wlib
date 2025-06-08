// CryptoCompare API configuration
const config = {
    // API key
    // apiKey: '204cf4cbc903b811a7b03605f6ef39b938577a12207e11d9e8a87682101a76dd',
    // apiKey: 'a79b73da505a673d3c59975172b5475f89e3f54db1e599752d8f51fa8d454e9f',
    // apiKey: '3c1257f2e76debab6991a8cb05a0051457ceb0b735b0ea7e3b63d8e096af823c',
    apiKey: 'f269fbc3dac1c1ccdd069e1dccf16fbf0c7b7f5aece72b6676a92c4daf1d0192',
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