import MongoDB from '../server/database/mongo.js';
import logger from '../utils/logger.js';
import GoalExecutor from '../server/strategies/goal.js';

async function runGoalExecution() {
    try {
        // 连接数据库
        await MongoDB.connect();
        // 创建目标执行器实例
        const executor = new GoalExecutor();

        // 清空现有目标数据
        await MongoDB.clearGoal();
        const options = {
            profitFilter: 50,           // 利润过滤器值
            dailyProfitFilter: 2,      // 日均利润过滤器值
            slopeThreshold: 0.5,       // 斜率阈值
            trendInterval: 40,         // 趋势区间
            durationFilter: 7,         // 持续时间过滤器值
            liquidityFilter: 50000         // 流动性过滤器值（单位：元）
        }
        // 执行所有股票的目标计算
        await executor.executeGoalAll(options);
        // 单个股票测试，传递用户提供的参数
        // const result = await executor.executeGoalSingle('ETH', options);
        // console.log(result);
        
        logger.info('所有股票目标计算完成');
    } catch (error) {
        logger.error('目标执行失败:', error);
        throw error;
    }
}

async function main() {
    try {
        await runGoalExecution();
    } catch (error) {
        console.error('Error:', error);
    }
}

main();