import MongoConnection from './connection.js';
import StockDB from './stock.js';
import DayLineDB from './dayLine.js';
import HourLineDB from './hourLine.js';
import TransactionDB from './transaction.js';
import SignalDB from './signal.js';

/**
 * MongoDB 数据库连接和基础操作类
 */
class MongoDB {
    static connect = MongoConnection.connect;

    static getList = StockDB.getList;
    static getStock = StockDB.getStock;
    static saveList = StockDB.saveList;

    static getLastDayLine = DayLineDB.getLastDayLine;
    static getFirstDayLine = DayLineDB.getFirstDayLine;
    static getDayLine = DayLineDB.getDayLine;
    static saveDayLine = DayLineDB.saveDayLine;
    static clearDayLine = DayLineDB.clearDayLine;

    static getTransaction = TransactionDB.getTransaction;
    static saveTransaction = TransactionDB.saveTransaction;
    static clearTransaction = TransactionDB.clearTransaction;

    static getSignal = SignalDB.getSignal;
    static saveSignal = SignalDB.saveSignal;
    static clearSignal = SignalDB.clearSignal;

    static getLastHourLine = HourLineDB.getLastHourLine;
    static getHourLine = HourLineDB.getHourLine;
    static saveHourLine = HourLineDB.saveHourLine;
    static clearHourLine = HourLineDB.clearHourLine;
}

export default MongoDB;