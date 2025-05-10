import { fetchAllDayLines } from '../server/fetchers/dayLineFetcher.js';
import MongoDB from '../server/database/mongo.js';

async function main() {
    try {
        // 连接数据库
        await MongoDB.connect();
        
        // 测试获取 BTC 的日线数据
        console.log('开始获取 BTC 日线数据...');
        await fetchAllDayLines();
        
        // 获取BTC的日线数据进行验证
        const btcData = await MongoDB.getDayLine('BTC');
        
        // 打印部分数据用于验证
        console.log('获取到的日线数据示例：', btcData[0]);
        console.log(`总共获取到 ${btcData.length} 条数据`);
    } catch (error) {
        console.error('测试失败:', error);
    }
}

main();