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
    static saveList = StockListDB.saveList;

    static getLastDayLine = DayLineDB.getLastDayLine;
    static getFirstDayLine = DayLineDB.getFirstDayLine;
    static getDayLine = DayLineDB.getDayLine;
    static saveDayLine = DayLineDB.saveDayLine;
    static clearDayLine = DayLineDB.clearDayLine;

    static getSignal = SignalDB.getSignal;
    static saveSignal = SignalDB.saveSignal;
    static clearSignal = SignalDB.clearSignal;

    static getLastHourLine = HourLineDB.getLastHourLine;
    static getHourLine = HourLineDB.getHourLine;
    static saveHourLine = HourLineDB.saveHourLine;
    static clearHourLine = HourLineDB.clearHourLine;
}

export default MongoDB;