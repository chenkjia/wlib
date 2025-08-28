const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function createStockData() {
  try {
    await client.connect();
    console.log('连接到 MongoDB');
    
    const db = client.db('flib');
    const stocksCollection = db.collection('stocks');
    
    // 先清空现有的股票数据
    await stocksCollection.deleteMany({});
    console.log('清空现有股票数据');
    
    // 创建 000001 股票数据
    console.log('创建 000001 股票数据...');
    
    // 生成小时线数据
    const hourLineData = [];
    const startTime = new Date('2020-10-10T00:00:00Z');
    
    for (let i = 0; i < 720; i++) {
      const time = new Date(startTime.getTime() + i * 60 * 60 * 1000);
      const basePrice = 10 + Math.sin(i / 100) * 2;
      const volatility = 0.1;
      
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      const volume = Math.random() * 1000000;
      
      hourLineData.push({
        time: time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(0)),
        amount: parseFloat((volume * (open + close) / 2).toFixed(2))
      });
    }
    
    // 生成日线数据
    const dayLineData = [];
    const dayStartTime = new Date('2020-01-01T00:00:00Z');
    
    for (let i = 0; i < 100; i++) {
      const time = new Date(dayStartTime.getTime() + i * 24 * 60 * 60 * 1000);
      const basePrice = 10 + Math.sin(i / 20) * 3;
      const volatility = 0.2;
      
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      const volume = Math.random() * 10000000;
      
      dayLineData.push({
        time: time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(0)),
        amount: parseFloat((volume * (open + close) / 2).toFixed(2))
      });
    }
    
    // 插入 000001 股票数据
    const stock000001 = {
      code: '000001',
      name: '平安银行',
      market: 'SZ',
      hourLine: hourLineData,
      dayLine: dayLineData
    };
    
    await stocksCollection.insertOne(stock000001);
    console.log('插入 000001 股票数据完成');
    
    // 创建 AAVE 股票数据
    console.log('创建 AAVE 股票数据...');
    
    // 生成 AAVE 小时线数据
    const aaveHourLineData = [];
    const aaveStartTime = new Date('2020-10-10T00:00:00Z');
    
    for (let i = 0; i < 720; i++) {
      const time = new Date(aaveStartTime.getTime() + i * 60 * 60 * 1000);
      const basePrice = 50 + Math.sin(i / 80) * 10;
      const volatility = 2;
      
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      const volume = Math.random() * 100000;
      
      aaveHourLineData.push({
        time: time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(2)),
        amount: parseFloat((volume * (open + close) / 2).toFixed(2))
      });
    }
    
    // 生成 AAVE 日线数据
    const aaveDayLineData = [];
    const aaveDayStartTime = new Date('2020-01-01T00:00:00Z');
    
    for (let i = 0; i < 100; i++) {
      const time = new Date(aaveDayStartTime.getTime() + i * 24 * 60 * 60 * 1000);
      const basePrice = 50 + Math.sin(i / 15) * 15;
      const volatility = 3;
      
      const open = basePrice + (Math.random() - 0.5) * volatility;
      const close = open + (Math.random() - 0.5) * volatility;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;
      const volume = Math.random() * 1000000;
      
      aaveDayLineData.push({
        time: time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(2)),
        amount: parseFloat((volume * (open + close) / 2).toFixed(2))
      });
    }
    
    // 插入 AAVE 股票数据
    const stockAAVE = {
      code: 'AAVE',
      name: 'Aave',
      market: 'CRYPTO',
      hourLine: aaveHourLineData,
      dayLine: aaveDayLineData
    };
    
    await stocksCollection.insertOne(stockAAVE);
    console.log('插入 AAVE 股票数据完成');
    
    console.log('所有股票测试数据创建完成！');
    
  } catch (error) {
    console.error('创建股票数据时出错:', error);
  } finally {
    await client.close();
  }
}

createStockData();