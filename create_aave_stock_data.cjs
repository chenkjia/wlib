const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const dbName = 'flib';

async function createAAVEStockData() {
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('连接到 MongoDB 成功');
    
    const db = client.db(dbName);
    const stocksCollection = db.collection('stocks');
    
    // 生成 AAVE 的小时线数据（最近30天，每天24小时）
    const hourLineData = [];
    const startTime = new Date();
    startTime.setDate(startTime.getDate() - 30); // 30天前
    
    let currentPrice = 150; // AAVE 起始价格
    
    for (let day = 0; day < 30; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const time = new Date(startTime);
        time.setDate(time.getDate() + day);
        time.setHours(hour, 0, 0, 0);
        
        const open = currentPrice;
        const change = (Math.random() - 0.5) * 10; // -5 到 +5 的随机变化
        const high = open + Math.abs(change) + Math.random() * 5;
        const low = open - Math.abs(change) - Math.random() * 5;
        const close = open + change;
        
        currentPrice = close;
        
        hourLineData.push({
          time: time,
          open: parseFloat(open.toFixed(4)),
          high: parseFloat(high.toFixed(4)),
          low: parseFloat(low.toFixed(4)),
          close: parseFloat(close.toFixed(4)),
          volume: Math.floor(Math.random() * 10000) + 1000,
          amount: Math.floor(Math.random() * 1000000) + 100000
        });
      }
    }
    
    // 生成 AAVE 的日线数据（最近100天）
    const dayLineData = [];
    const dayStartTime = new Date();
    dayStartTime.setDate(dayStartTime.getDate() - 100); // 100天前
    
    currentPrice = 140; // 重置价格
    
    for (let day = 0; day < 100; day++) {
      const time = new Date(dayStartTime);
      time.setDate(time.getDate() + day);
      time.setHours(0, 0, 0, 0);
      
      const open = currentPrice;
      const change = (Math.random() - 0.5) * 20; // -10 到 +10 的随机变化
      const high = open + Math.abs(change) + Math.random() * 10;
      const low = open - Math.abs(change) - Math.random() * 10;
      const close = open + change;
      
      currentPrice = close;
      
      dayLineData.push({
        time: time,
        open: parseFloat(open.toFixed(4)),
        high: parseFloat(high.toFixed(4)),
        low: parseFloat(low.toFixed(4)),
        close: parseFloat(close.toFixed(4)),
        volume: Math.floor(Math.random() * 100000) + 10000,
        amount: Math.floor(Math.random() * 10000000) + 1000000
      });
    }
    
    // 创建 AAVE 股票文档
    const aaveStock = {
      code: 'AAVE',
      name: 'Aave (AAVE)',
      hourLine: hourLineData,
      dayLine: dayLineData
    };
    
    // 删除现有的 AAVE 数据（如果存在）
    await stocksCollection.deleteMany({ code: 'AAVE' });
    console.log('删除现有 AAVE 数据');
    
    // 插入新的 AAVE 数据
    const result = await stocksCollection.insertOne(aaveStock);
    console.log(`AAVE 股票数据插入成功，ID: ${result.insertedId}`);
    console.log(`插入了 ${hourLineData.length} 条小时线数据`);
    console.log(`插入了 ${dayLineData.length} 条日线数据`);
    
  } catch (error) {
    console.error('创建 AAVE 股票数据失败:', error);
  } finally {
    await client.close();
    console.log('MongoDB 连接已关闭');
  }
}

createAAVEStockData();