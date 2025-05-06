const { fetchAllHourLines } = require('../src/fetchers/hourLineFetcher');
const MongoDB = require('../src/database/mongo');

async function main() {
    try {
        // 连接数据库
        await MongoDB.connect();
        
        // 测试获取所有加密货币的小时线数据
        console.log('开始获取小时线数据...');
        const hourLineData = await fetchAllHourLines();
        
        // 打印部分数据用于验证
        
        console.log('小时线数据获取完成');
    } catch (error) {
        console.error('测试失败:', error);
    }
}

main();