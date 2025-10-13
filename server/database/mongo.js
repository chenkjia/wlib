import MongoConnection from './connection.js';
import StockDB from './stock.js';
import DayLineDB from './dayLine.js';
import HourLineDB from './hourLine.js';
import TransactionDB from './transaction.js';
import SignalDB from './signal.js';
import GoalDB from './goal.js';
import TaskDB from './task.js';
import IndicatorDB from './indicator.js';

/**
 * MongoDB 数据库连接和基础操作类
 */
class MongoDB {
    static connect = MongoConnection.connect;
    static disconnect = MongoConnection.disconnect;

    static getAll = StockDB.getAll;
    static getFocusedStocks = StockDB.getFocusedStocks;
    static getList = StockDB.getList;
    static getStock = StockDB.getStock;
    static updateStock = StockDB.updateStock;
    static removeStock = StockDB.removeStock;
    static saveList = StockDB.saveList;
    static updateStockStar = StockDB.updateStockStar;
    static getStarredStocks = StockDB.getStarredStocks;

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

    // Indicators CRUD
    static getIndicators = IndicatorDB.getList;
    static getIndicatorByCode = IndicatorDB.getIndicatorByCode;
    static createIndicator = IndicatorDB.createIndicator;
    static updateIndicator = IndicatorDB.updateIndicator;
    static deleteIndicator = IndicatorDB.deleteIndicator;
    static updateGoal = GoalDB.updateGoal;
    static clearGoal = GoalDB.clearGoal;

    static getTask = TaskDB.getTask;
    static createTask = TaskDB.createTask;
    static updateTaskStatus = TaskDB.updateTaskStatus;
    static updateTaskProgress = TaskDB.updateTaskProgress;
    static updateTask = TaskDB.updateTask;
    static getTasks = TaskDB.getTasks;
    static deleteTask = TaskDB.deleteTask;
    static clearTasks = TaskDB.clearTasks;
}

export default MongoDB;