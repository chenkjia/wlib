import mongoose from 'mongoose';

const stockListSchema = new mongoose.Schema({
    // 添加索引配置
    code: { type: String, required: true, unique: true, index: true },
    'dayLine.time': { type: String, required: true, unique: true, index: true },
    'hourLine.time': { type: String, required: true, unique: true, index: true },
    
    
    name: { type: String, required: true },
    market: { type: String, required: true },
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

const StockList = mongoose.model('StockList', stockListSchema);

export { StockList };