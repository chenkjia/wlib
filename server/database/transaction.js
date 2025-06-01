import logger from '../utils/logger.js';
import { Transaction } from './models/transaction.js';

/**
 * 交易数据库操作类
 */
class TransactionDB {
    /**
     * 通过ID获取交易记录
     * @param {string} id - 交易ID
     * @returns {Promise<Object>} 交易数据
     */
    static async getTransaction(id) {
        try {
            const transaction = await Transaction.findById(id);
            if (!transaction) {
                throw new Error(`交易ID ${id} 不存在`);
            }
            return transaction;
        } catch (error) {
            logger.error('通过ID获取交易记录失败:', error);
            throw error;
        }
    }

    /**
     * 保存交易记录
     * @param {string} code - 股票代码
     * @param {Array} data - 交易数据
     * @returns {Promise} 保存结果
     */
    static async saveTransaction(code, data) {
        try {
            const transactionData = data.map(transaction => ({
                ...transaction,
                stockCode: code
            }));
            const result = await Transaction.insertMany(transactionData);
            return result;
        } catch (error) {
            logger.error('保存交易记录失败:', error);
            throw error;
        }
    }

    /**
     * 清空交易数据
     * @returns {Promise} 清空结果
     */
    static async clearTransaction() {
        try {
            const result = await Transaction.deleteMany();
            return result;
        } catch (error) {
            logger.error('清空交易数据失败:', error);
            throw error;
        }
    }


}

export default TransactionDB;