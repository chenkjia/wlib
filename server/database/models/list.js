const mongoose = require('mongoose');

const stockListSchema = new mongoose.Schema({
    // 添加索引配置
    code: { type: String, required: true, unique: true, index: true },
    'dayLine.date': { type: String, index: true },
    'hourLine.time': { type: String, index: true },
    
    
    name: { type: String, required: true },
    market: { type: String, required: true },
    dayLine: [{
        date: String,
        open: Number,
        high: Number,
        low: Number,
        close: Number,
        volume: Number,
        amount: Number
    }],
    hourLine: [{
        time: String,
        // open: Number,
        // high: Number,
        // low: Number,
        close: Number,
        volume: Number,
        // amount: Number
    }],
    dayMetric: [{
        date: String,
        ma: Object,
        macd: Object,
        kdj: Object,
        rsi: Object
    }],
    signal: [{
        buyTime: String,
        buyPrice: Number,
        buyVolume: Number,
        buyAmount: Number,
        sellTime: String,
        sellPrice: Number,
        sellVolume: Number,
        sellAmount: Number,
        profit: Number
    }]
});

const StockList = mongoose.model('StockList', stockListSchema);

module.exports = {
    StockList
};