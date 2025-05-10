import mongoose from 'mongoose';

const signalSchema = new mongoose.Schema({
    stockCode: { type: String, required: true, index: true },
    buyTime: { type: Date },
    buyPrice: { type: Number },
    buyVolume: { type: Number},
    buyAmount: { type: Number},
    sellTime: { type: Date },
    sellPrice: { type: Number },
    sellVolume: { type: Number },
    sellAmount: { type: Number },
    profit: { type: Number }
});

// 创建复合索引以提高查询效率
signalSchema.index({ stockCode: 1, buyTime: -1 });

const Signal = mongoose.model('Signal', signalSchema);

export { Signal };