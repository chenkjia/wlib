module.exports = {
  stocks: ['BTC','ETH','SUSHI','AAVE','UNI','SFL','X2Y2','ABT','SUI','NPC','SAND'],
  // MongoDB配置
  mongodb: {
    uri: 'mongodb://localhost:27017/flib',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true
    }
  },

  // 数据源配置
  dataSources: {
    stock: {
      baseUrl: 'https://api.example.com',  // 示例API地址，需要替换为实际的数据源
      apiKey: 'your_api_key_here',
      requestLimit: 60  // 每分钟请求限制
    }
  },

  // 定时任务配置
  scheduler: {
    // 日线数据更新时间（每天收盘后）
    dailyUpdate: '0 30 15 * * 1-5',  // 周一至周五15:30执行
    // 小时线数据更新间隔（交易时段）
    hourlyUpdate: '0 0 9-15 * * 1-5'  // 周一至周五9点到15点每小时执行
  },

  // 日志配置
  logger: {
    level: 'info',
    filename: './logs/app.log'
  }
}