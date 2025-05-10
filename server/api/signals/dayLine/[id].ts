import MongoDB from '../../../database/mongo.js';

// 定义Signal类型接口
interface Signal {
  _id: string;
  stockCode: string;
  buyTime: Date;
  buyPrice: number;
  buyVolume?: number;
  buyAmount?: number;
  sellTime?: Date;
  sellPrice?: number;
  sellVolume?: number;
  sellAmount?: number;
  profit?: number;
}

/**
 * 获取交易信号相关的日线数据
 * 自动计算时间范围：买入时间前100天到卖出时间后100天
 * @returns {Object} 信号和日线数据
 */
export default defineEventHandler(async (event) => {
  const id = event.context.params?.id;
  
  if (!id) {
    throw createError({
      statusCode: 400,
      message: '信号ID不能为空'
    });
  }

  try {
    await MongoDB.connect();
    
    // 1. 获取交易信号
    const signal = await MongoDB.getSignal(id) as Signal;
    
    // 2. 计算日期范围
    const buyDate = new Date(signal.buyTime);
    const startDate = new Date(buyDate);
    startDate.setDate(startDate.getDate() - 300); // 买入时间前100天
    
    let endDate;
    if (signal.sellTime) {
      endDate = new Date(signal.sellTime);
      endDate.setDate(endDate.getDate() + 300); // 卖出时间后100天
    } else {
      endDate = new Date();
    }
    
    // 3. 获取日线数据
    const dayLine = await MongoDB.getDayLine(
      signal.stockCode,
      startDate,
      endDate
    );
    
    return {
      signal,
      dayLine
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw createError({
      statusCode: 500,
      message: `获取交易信号日线数据失败: ${errorMessage}`
    });
  }
}); 