const { MongoClient } = require('mongodb');

const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

async function createTestData() {
  try {
    await client.connect();
    console.log('连接到 MongoDB');
    
    const db = client.db('flib');
    const hourLineCollection = db.collection('hourLine');
    const dayLineCollection = db.collection('dayLine');
    
    // 为 000001 创建小时线数据
    console.log('插入 000001 小时线数据...');
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
        stockCode: '000001',
        time: time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(0)),
        amount: parseFloat((volume * (open + close) / 2).toFixed(2))
      });
    }
    
    await hourLineCollection.insertMany(hourLineData);
    console.log(`插入了 ${hourLineData.length} 条 000001 小时线数据`);
    
    // 为 000001 创建日线数据
    console.log('插入 000001 日线数据...');
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
        stockCode: '000001',
        time: time,
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume: parseFloat(volume.toFixed(0)),
        amount: parseFloat((volume * (open + close) / 2).toFixed(2))
      });
    }
    
    await dayLineCollection.insertMany(dayLineData);
    console.log(`插入了 ${dayLineData.length} 条 000001 日线数据`);
    
    console.log('000001 测试数据创建完成！');
    
  } catch (error) {
    console.error('创建测试数据时出错:', error);
  } finally {
    await client.close();
  }
}

createTestData();