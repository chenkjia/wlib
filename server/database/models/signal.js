import mongoose from 'mongoose';

const signalSchema = new mongoose.Schema({
    stockCode: { type: String, required: true, index: true },
    signalTime: { type: Date },
    signalPrice: { type: Number }
});

// 创建复合索引以提高查询效率
signalSchema.index({ stockCode: 1, buyTime: -1 });

const Signal = mongoose.model('Signal', signalSchema);

export { Signal };