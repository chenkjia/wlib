import mongoose from 'mongoose';

const stockSchema = new mongoose.Schema({
    // 添加索引配置
    code: { type: String, required: true, unique: true, index: true },
    'dayLine.time': { type: String, required: true, index: true },
    'hourLine.time': { type: String, required: true, index: true },
    name: { type: String, required: true },
    market: { type: String, required: true },
    isFocused: { type: Boolean, default: false, index: true }, // 是否重点关注
    dayLine: [{
        time: Date,
        open: Number,
        high: Number,
        low: Number,
        close: Number,
        volume: Number,
        amount: Number
    }],
    hourLine: [{
        time: Date,
        open: Number,
        high: Number,
        low: Number,
        close: Number,
        volume: Number,
        amount: Number
    }],

});

const Stock = mongoose.model('Stock', stockSchema);

export { Stock };