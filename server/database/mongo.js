import MongoConnection from './connection.js';
import StockDB from './stock.js';
import DayLineDB from './dayLine.js';
import HourLineDB from './hourLine.js';
import TransactionDB from './transaction.js';
import SignalDB from './signal.js';
import GoalDB from './goal.js';

/**
 * MongoDB 数据库连接和基础操作类
 */
class MongoDB {
    static connect = MongoConnection.connect;
    static disconnect = MongoConnection.disconnect;

    static getAll = StockDB.getAll;
    static getFocusedStocks = StockDB.getFocusedStocks;
    static updateAllFocusedStatus = StockDB.updateAllFocusedStatus;
    static updateAllHourFocusedStatus = StockDB.updateAllHourFocusedStatus;
    static getList = StockDB.getList;
    static getStock = StockDB.getStock;
    static removeStock = StockDB.removeStock;
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
    
    static getGoal = GoalDB.getGoal;
    static getGoalsByStock = GoalDB.getGoalsByStock;
    static saveGoal = GoalDB.saveGoal;
    static updateGoal = GoalDB.updateGoal;
    static clearGoal = GoalDB.clearGoal;
}

export default MongoDB;