import logger from '~/utils/logger.js';
import { Signal } from './models/signal.js';

/**
 * 交易信号数据库操作类
 */
class SignalDB {
    /**
     * 通过ID获取交易信号
     * @param {string} id - 信号ID
     * @returns {Promise<Object>} 交易信号数据
     */
    static async getSignal(id) {
        try {
            const signal = await Signal.findById(id);
            if (!signal) {
                throw new Error(`信号ID ${id} 不存在`);
            }
            return signal;
        } catch (error) {
            logger.error('通过ID获取交易信号失败:', error);
            throw error;
        }
    }

    /**
     * 保存交易信号
     * @param {string} code - 股票代码
     * @param {Array} data - 信号数据
     * @returns {Promise} 保存结果
     */
    static async saveSignal(code, data) {
        try {
            const signalData = data.map(signal => ({
                ...signal,
                stockCode: code
            }));
            const result = await Signal.insertMany(signalData);
            return result;
        } catch (error) {
            logger.error('保存交易信号失败:', error);
            throw error;
        }
    }

    /**
     * 清空交易信号数据
     * @returns {Promise} 清空结果
     */
    static async clearSignal() {
        try {
            const result = await Signal.deleteMany();
            return result;
        } catch (error) {
            logger.error('清空交易信号数据失败:', error);
            throw error;
        }
    }
}

export default SignalDB;