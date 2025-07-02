import logger from '../utils/logger.js';
import { Goal } from './models/goal.js';

/**
 * 目标数据库操作类
 */
class GoalDB {
    /**
     * 通过ID获取目标记录
     * @param {string} id - 目标ID
     * @returns {Promise<Object>} 目标数据
     */
    static async getGoal(id) {
        try {
            const goal = await Goal.findById(id);
            if (!goal) {
                throw new Error(`目标ID ${id} 不存在`);
            }
            return goal;
        } catch (error) {
            logger.error('通过ID获取目标记录失败:', error);
            throw error;
        }
    }

    /**
     * 获取股票的所有目标
     * @param {string} code - 股票代码
     * @returns {Promise<Array>} 目标数据列表
     */
    static async getGoalsByStock(code) {
        try {
            const goals = await Goal.find({ stockCode: code }).sort({ startTime: -1 });
            return goals;
        } catch (error) {
            logger.error(`获取股票 ${code} 的目标记录失败:`, error);
            throw error;
        }
    }

    /**
     * 保存目标记录
     * @param {string} code - 股票代码
     * @param {Array} data - 目标数据
     * @returns {Promise} 保存结果
     */
    static async saveGoal(code, data) {
        try {
            const goalData = data.map(goal => ({
                ...goal,
                stockCode: code
            }));
            const result = await Goal.insertMany(goalData);
            return result;
        } catch (error) {
            logger.error('保存目标记录失败:', error);
            throw error;
        }
    }

    /**
     * 更新目标状态
     * @param {string} id - 目标ID
     * @param {Object} updateData - 更新数据
     * @returns {Promise} 更新结果
     */
    static async updateGoal(id, updateData) {
        try {
            const result = await Goal.findByIdAndUpdate(id, updateData, { new: true });
            return result;
        } catch (error) {
            logger.error(`更新目标 ${id} 失败:`, error);
            throw error;
        }
    }

    /**
     * 清空目标数据
     * @returns {Promise} 清空结果
     */
    static async clearGoal() {
        try {
            const result = await Goal.deleteMany();
            return result;
        } catch (error) {
            logger.error('清空目标数据失败:', error);
            throw error;
        }
    }
}

export default GoalDB;