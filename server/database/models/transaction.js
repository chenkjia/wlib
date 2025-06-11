import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    stockCode: { type: String, required: true, index: true },
    signalTime: { type: Date },
    signalPrice: { type: Number },
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
transactionSchema.index({ stockCode: 1, signalTime: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export { Transaction };