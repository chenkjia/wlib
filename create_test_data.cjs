const { MongoClient } = require('mongodb');

async function createTestData() {
  const client = await MongoClient.connect('mongodb://localhost:27017/flib');
  const db = client.db('flib');
  
  // 为 AAVE 创建小时线测试数据
  const hourLineData = [];
  const startDate = new Date('2024-11-04T00:00:00.000Z');
  const basePrice = 125.66;
  
  // 生成30天的小时数据
  for (let day = 0; day < 30; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const time = new Date(startDate);
      time.setDate(time.getDate() + day);
      time.setHours(hour);
      
      // 模拟价格波动
      const priceVariation = (Math.random() - 0.5) * 10; // ±5的随机波动
      const dayTrend = Math.sin(day * 0.1) * 20; // 长期趋势
      const hourTrend = Math.sin(hour * 0.3) * 5; // 日内波动
      
      const price = basePrice + dayTrend + hourTrend + priceVariation;
      const volume = Math.floor(Math.random() * 1000000) + 500000;
      
      hourLineData.push({
        stockCode: 'AAVE',
        time: time,
        open: price * (0.99 + Math.random() * 0.02),
        high: price * (1.01 + Math.random() * 0.02),
        low: price * (0.98 + Math.random() * 0.02),
        close: price,
        volume: volume
      });
    }
  }
  
  // 为 AAVE 创建日线测试数据
  const dayLineData = [];
  for (let day = 0; day < 100; day++) {
    const time = new Date(startDate);
    time.setDate(time.getDate() + day);
    
    const priceVariation = (Math.random() - 0.5) * 15;
    const trend = Math.sin(day * 0.05) * 30;
    const price = basePrice + trend + priceVariation;
    const volume = Math.floor(Math.random() * 5000000) + 1000000;
    
    dayLineData.push({
      stockCode: 'AAVE',
      time: time,
      open: price * (0.98 + Math.random() * 0.04),
      high: price * (1.02 + Math.random() * 0.03),
      low: price * (0.96 + Math.random() * 0.04),
      close: price,
      volume: volume
    });
  }
  
  // 插入数据
  console.log('插入小时线数据...');
  await db.collection('hourLine').insertMany(hourLineData);
  console.log(`插入了 ${hourLineData.length} 条小时线数据`);
  
  console.log('插入日线数据...');
  await db.collection('dayLine').insertMany(dayLineData);
  console.log(`插入了 ${dayLineData.length} 条日线数据`);
  
  // 为 ABT 也创建一些数据
  const abtHourLineData = [];
  const abtStartDate = new Date('2018-08-16T00:00:00.000Z');
  const abtBasePrice = 0.1406;
  
  for (let day = 0; day < 20; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const time = new Date(abtStartDate);
      time.setDate(time.getDate() + day);
      time.setHours(hour);
      
      const priceVariation = (Math.random() - 0.5) * 0.02;
      const dayTrend = Math.sin(day * 0.2) * 0.05;
      const price = abtBasePrice + dayTrend + priceVariation;
      const volume = Math.floor(Math.random() * 500000) + 100000;
      
      abtHourLineData.push({
        stockCode: 'ABT',
        time: time,
        open: price * (0.99 + Math.random() * 0.02),
        high: price * (1.01 + Math.random() * 0.02),
        low: price * (0.98 + Math.random() * 0.02),
        close: price,
        volume: volume
      });
    }
  }
  
  console.log('插入 ABT 小时线数据...');
  await db.collection('hourLine').insertMany(abtHourLineData);
  console.log(`插入了 ${abtHourLineData.length} 条 ABT 小时线数据`);
  
  await client.close();
  console.log('测试数据创建完成！');
}

createTestData().catch(console.error);