const MongoDB = require('../src/database/mongo');
const { StockList } = require('../src/database/models/list');

async function main() {
    try {
        // 连接数据库
        await MongoDB.connect();
        
        // 获取所有股票列表
        console.log('开始获取股票列表...');
        const stockList = await MongoDB.getList();
        console.log(`获取到 ${stockList.length} 只股票`);
        
        // 清空日线数据
        console.log('\n开始清空日线数据...');
        let successCount = 0;
        for (const stock of stockList) {
            try {
                await MongoDB.clearDayLine(stock.code);
                successCount++;
            } catch (error) {
                console.error(`清空${stock.code}日线数据失败:`, error);
            }
        }
        console.log(`成功清空 ${successCount} 只股票的日线数据`);
        
        // 清空小时线数据
        console.log('\n开始清空小时线数据...');
        successCount = 0;
        for (const stock of stockList) {
            try {
                await StockList.updateOne(
                    { code: stock.code },
                    { $set: { hourLine: [] } }
                );
                successCount++;
            } catch (error) {
                console.error(`清空${stock.code}小时线数据失败:`, error);
            }
        }
        console.log(`成功清空 ${successCount} 只股票的小时线数据`);
        
        console.log('\n数据清空完成！');
    } catch (error) {
        console.error('清空数据失败:', error);
    }
}

main();