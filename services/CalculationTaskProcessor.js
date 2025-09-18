/**
 * 计算任务处理器
 * 用于处理计算任务并生成结果
 */

/**
 * 处理计算任务
 * @param {Object} task 计算任务
 * @param {Object} task.params 计算参数
 * @returns {Promise<Object>} 计算结果
 */
export async function processCalculationTask(task) {
  console.log(`[CalculationTaskProcessor] 开始处理任务，参数:`, task.params);
  
  // 模拟计算过程
  const result = await simulateCalculation(task.params);
  
  // 保存结果到数据库
  await saveResultToDatabase(task.id, result);
  
  return result;
}

/**
 * 模拟计算过程
 * @param {Object} params 计算参数
 * @returns {Promise<Object>} 模拟计算结果
 * @private
 */
async function simulateCalculation(params) {
  // 模拟计算耗时
  await new Promise(resolve => setTimeout(resolve, 10000 + Math.random() * 1000));
  
  // 从参数中提取MA配置
  const { ma, buyAlgorithm, sellAlgorithm } = params;
  
  // 生成模拟交易记录
  const transactions = generateMockTransactions(ma, buyAlgorithm, sellAlgorithm);
  
  // 计算模拟统计指标
  const stats = calculateStats(transactions);
  
  return {
    params,
    timestamp: new Date(),
    transactions,
    stats
  };
}

/**
 * 生成模拟交易记录
 * @param {Object} ma MA参数
 * @param {Array} buyAlgorithm 买入算法
 * @param {Array} sellAlgorithm 卖出算法
 * @returns {Array} 模拟交易记录
 * @private
 */
function generateMockTransactions(ma, buyAlgorithm, sellAlgorithm) {
  const transactions = [];
  const transactionCount = 5 + Math.floor(Math.random() * 15); // 5-20笔交易
  
  let lastPrice = 100; // 初始价格
  let lastTime = new Date(2023, 0, 1).getTime(); // 初始时间
  
  for (let i = 0; i < transactionCount; i++) {
    // 生成买入记录
    const buyPrice = lastPrice * (1 + (Math.random() * 0.05 - 0.02)); // 在上一价格基础上波动±2%
    const buyTime = new Date(lastTime + Math.random() * 86400000 * 7); // 在上一时间后1-7天
    
    // 生成卖出记录
    const priceChange = Math.random() > 0.6 ? (Math.random() * 0.15 + 0.02) : (Math.random() * 0.1 - 0.15); // 60%概率盈利，40%概率亏损
    const sellPrice = buyPrice * (1 + priceChange);
    const sellTime = new Date(buyTime.getTime() + Math.random() * 86400000 * 14); // 持有1-14天
    
    // 计算收益
    const profit = ((sellPrice - buyPrice) / buyPrice) * 100;
    
    transactions.push({
      buyTime: buyTime.toISOString(),
      buyPrice: parseFloat(buyPrice.toFixed(2)),
      sellTime: sellTime.toISOString(),
      sellPrice: parseFloat(sellPrice.toFixed(2)),
      profit: parseFloat(profit.toFixed(2))
    });
    
    lastPrice = sellPrice;
    lastTime = sellTime.getTime();
  }
  
  return transactions;
}

/**
 * 计算统计指标
 * @param {Array} transactions 交易记录
 * @returns {Object} 统计指标
 * @private
 */
function calculateStats(transactions) {
  if (transactions.length === 0) {
    return {
      totalTransactions: 0,
      profitableTransactions: 0,
      lossTransactions: 0,
      winRate: 0,
      totalProfit: 0,
      avgProfit: 0,
      maxProfit: 0,
      maxLoss: 0
    };
  }
  
  const profitableTransactions = transactions.filter(t => t.profit > 0).length;
  const profits = transactions.map(t => t.profit);
  const totalProfit = profits.reduce((sum, p) => sum + p, 0);
  
  return {
    totalTransactions: transactions.length,
    profitableTransactions,
    lossTransactions: transactions.length - profitableTransactions,
    winRate: parseFloat((profitableTransactions / transactions.length * 100).toFixed(2)),
    totalProfit: parseFloat(totalProfit.toFixed(2)),
    avgProfit: parseFloat((totalProfit / transactions.length).toFixed(2)),
    maxProfit: parseFloat(Math.max(...profits).toFixed(2)),
    maxLoss: parseFloat(Math.min(...profits).toFixed(2))
  };
}

/**
 * 保存结果到数据库
 * @param {string} taskId 任务ID
 * @param {Object} result 计算结果
 * @returns {Promise<void>}
 * @private
 */
export async function saveResultToDatabase(taskId, result) {
  console.log(`[CalculationTaskProcessor] 保存任务结果到数据库: ${taskId}`);
  
  try {
    // 调用API保存结果
    await fetch('/api/calculation-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ taskId, result })
    });
    
    console.log(`[CalculationTaskProcessor] 任务结果已保存: ${taskId}`);
    return true;
  } catch (error) {
    console.error(`[CalculationTaskProcessor] 保存任务结果失败: ${taskId}`, error);
    throw error;
  }
}