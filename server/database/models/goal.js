import mongoose from 'mongoose';

const goalSchema = new mongoose.Schema({
    stockCode: { type: String, required: true, index: true },
    startTime: { type: Date },
    startPrice: { type: Number },
    goalType: { type: String, enum: ['buy', 'sell'] },
    endTime: { type: Date },
    endPrice: { type: Number },
    profit: { type: Number },
    trendCategory: { type: String, enum: ['NEW_HIGH', 'REBOUND', 'NORMAL'], default: 'NORMAL' },
    duration: { type: Number },
    dailyProfit: { type: Number },
    usedSlopeAnalysis: { type: Boolean, default: false },
    liquidityStats: {
        avg: { type: Number },
        min: { type: Number },
        max: { type: Number },
        median: { type: Number }
    }
});

// 创建复合索引以提高查询效率
goalSchema.index({ stockCode: 1, startTime: -1 });

const Goal = mongoose.model('Goal', goalSchema);

export { Goal };