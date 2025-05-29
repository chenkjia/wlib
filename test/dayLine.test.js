import { fetchAllDayLines, fetchDayLine } from '../server/fetchers/dayLineFetcher.js';
import MongoDB from '../server/database/mongo.js';

async function main() {
    try {
        // 连接数据库
        await MongoDB.connect();
        
        console.log('开始获取日线数据...');
        // await fetchAllDayLines();
        await fetchDayLine('DBX');
        console.log('所有日线数据获取完成');
    } catch (error) {
        console.error('测试失败:', error);
    }
}

main();