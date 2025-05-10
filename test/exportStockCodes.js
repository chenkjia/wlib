import MongoDB from '../server/database/mongo.js';
import fs from 'fs/promises';
import path from 'path';
import logger from '../server/utils/logger.js';

/**
 * 从数据库读取所有股票列表，提取代码并保存为JSON文件
 */
async function exportStockCodes() {
  try {
    // 连接数据库
    await MongoDB.connect();
    
    logger.info('开始从数据库读取股票列表...');
    
    // 获取所有股票基本信息
    const stocks = await MongoDB.getList();
    
    if (!stocks || stocks.length === 0) {
      logger.error('没有找到任何股票数据');
      return;
    }
    
    logger.info(`成功读取 ${stocks.length} 只股票数据`);
    
    // 提取股票代码
    const stockCodes = stocks.map(stock => stock.code);
    
    // 准备输出文件路径
    const outputDir = path.resolve(process.cwd(), 'data');
    const outputFile = path.join(outputDir, 'stockCodes.json');
    
    // 确保输出目录存在
    try {
      await fs.mkdir(outputDir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
    
    // 构建输出对象，包含代码数组和元数据
    const outputData = {
      count: stockCodes.length,
      exportDate: new Date().toISOString(),
      codes: stockCodes
    };
    
    // 写入文件
    await fs.writeFile(
      outputFile, 
      JSON.stringify(outputData, null, 2),
      'utf8'
    );
    
    logger.info(`成功将 ${stockCodes.length} 个股票代码保存到文件: ${outputFile}`);
    
  } catch (error) {
    logger.error('导出股票代码时发生错误:', error);
    throw error;
  }
}

// 执行导出函数
exportStockCodes()
  .then(() => {
    logger.info('股票代码导出完成');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('股票代码导出失败:', error);
    process.exit(1);
  }); 