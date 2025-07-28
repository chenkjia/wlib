import MongoDB from '../server/database/mongo.js';

/**
 * 获取所有的日线数据
 * 调用getList取得股票列表数据，循环调用fetchDayLine
 */
async function removeList() {
  try {
      // 获取加密货币列表
      const stockList = await MongoDB.getAll();
      console.info(`开始获取所有加密货币的日线数据，共 ${stockList.length} 个币种`);

      for (let index = 0; index < 10000; index++) {
        const stock = stockList[index];
        console.log(`${index}/${stockList.length}`)
        const stockDetail = await MongoDB.getStock(stock.code)
        if (stockDetail.dayLine.length === 0) {
          const result = await MongoDB.removeStock(stock.code)
          console.log(result)
        }
      }

      console.info('所有加密货币日线数据获取完成');
  } catch (error) {
      console.error('获取所有日线数据失败:', error);
      throw error;
  }
}

async function main() {
    try {
        await MongoDB.connect();
        const result = await removeList();
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();