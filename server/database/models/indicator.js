import mongoose from 'mongoose';

/**
 * 指标（Indicator）数据模型
 * 字段：
 * - name: 指标名称（string, required）
 * - code: 指标代码（string, required, unique, index）
 * - usedIndicators: 使用的基础指标列表（array of string）
 * - calcMethod: 指标计算方法标识（string）
 * - calcParams: 指标计算参数（Mixed 对象）
 * - group: 指标组（string，默认 'default'），用于前端分组展示
 */
const indicatorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, index: true, trim: true },
  group: { type: String, default: 'default', trim: true },
  usedIndicators: { type: [String], default: [] },
  calcMethod: { type: String, default: '' },
  calcParams: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

// 索引以提升常用查询性能
indicatorSchema.index({ name: 1 });
indicatorSchema.index({ code: 1 });
// 为分组字段加索引，便于列表按组查询/排序
indicatorSchema.index({ group: 1 });

const Indicator = mongoose.model('Indicator', indicatorSchema);

export { Indicator };