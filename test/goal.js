import MongoDB from '../server/database/mongo.js';
import logger from '../server/utils/logger.js';
import GoalExecutor from '../server/strategies/goal.js';

async function runGoalExecution() {
    try {
        // 连接数据库
        await MongoDB.connect();
        // 创建目标执行器实例
        const executor = new GoalExecutor();

        // 清空现有目标数据
        await MongoDB.clearGoal();
        // 执行所有股票的目标计算
        // await executor.executeGoalAll();
        // 单个股票测试
        const result = await executor.executeGoalSingle('ETH');
        console.log(result);
        
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