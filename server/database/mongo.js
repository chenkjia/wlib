import MongoConnection from './connection.js';
import StockListDB from './stockList.js';
import DayLineDB from './dayLine.js';
import HourLineDB from './hourLine.js';
import SignalDB from './signal.js';

/**
 * MongoDB 数据库连接和基础操作类
 */
class MongoDB {
    static connect = MongoConnection.connect;
    static getList = StockListDB.getList;
    static getStock = StockListDB.getStock;
    static getLastDayLine = DayLineDB.getLastDayLine;
    static getFirstDayLine = DayLineDB.getFirstDayLine;
    static getDayLine = DayLineDB.getDayLine;
    static getSignal = SignalDB.getSignal;
    static saveList = StockListDB.saveList;
    static saveDayLine = DayLineDB.saveDayLine;
    static saveSignal = SignalDB.saveSignal;
    static clearDayLine = DayLineDB.clearDayLine;
    static clearSignal = SignalDB.clearSignal;
    static getLastHourLine = HourLineDB.getLastHourLine;
    static saveHourLine = HourLineDB.saveHourLine;
}

export default MongoDB;