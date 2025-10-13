import logger from '~/utils/logger.js';
import { Indicator } from './models/indicator.js';

/**
 * 指标（Indicator）数据库操作类
 */
class IndicatorDB {
  /**
   * 获取指标列表（分页、搜索、排序）
   */
  static async getList(page = 1, pageSize = 20, search = '', sortBy = 'code', sortOrder = 'asc') {
    try {
      const skip = (Number(page) - 1) * Number(pageSize);
      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: new RegExp(search, 'i') } },
          { code: { $regex: new RegExp(search, 'i') } }
        ];
      }
      const sort = { [String(sortBy)]: sortOrder === 'desc' ? -1 : 1 };

      const [total, items] = await Promise.all([
        Indicator.countDocuments(filter),
        Indicator.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(Number(pageSize))
          .lean()
      ]);

      return { total, page: Number(page), pageSize: Number(pageSize), data: items };
    } catch (error) {
      logger.error('获取指标列表失败:', error);
      throw error;
    }
  }

  /** 获取单条指标 */
  static async getIndicatorByCode(code) {
    try {
      return await Indicator.findOne({ code }).lean();
    } catch (error) {
      logger.error('获取指标失败:', error);
      throw error;
    }
  }

  /** 创建指标 */
  static async createIndicator(payload) {
    try {
      const doc = new Indicator(payload);
      await doc.save();
      return doc.toObject();
    } catch (error) {
      logger.error('创建指标失败:', error);
      throw error;
    }
  }

  /** 更新指标 */
  static async updateIndicator(code, updateData) {
    try {
      const updated = await Indicator.findOneAndUpdate(
        { code },
        { $set: updateData },
        { new: true }
      ).lean();
      return updated;
    } catch (error) {
      logger.error('更新指标失败:', error);
      throw error;
    }
  }

  /** 删除指标 */
  static async deleteIndicator(code) {
    try {
      const result = await Indicator.deleteOne({ code });
      return result;
    } catch (error) {
      logger.error('删除指标失败:', error);
      throw error;
    }
  }
}

export default IndicatorDB;