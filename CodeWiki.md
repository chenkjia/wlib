# Wlib 股票数据分析系统 Code Wiki

## 1. 项目整体架构 (Overall Architecture)
本项目是一个基于全栈 JavaScript 技术栈的股票数据分析与自动化回测系统。
系统采用前后端分离但同构在 Nuxt 3 框架下的架构，支持股票数据的定时抓取、指标计算、自定义策略回测以及重点股票的自动化监控。

### 核心架构层级：
- **前端展示层 (Frontend)**：基于 Vue 3 和 Nuxt 3 UI 构建，提供图表可视化（K线、指标图）、回测结果分析看板以及强大的“策略条件树编辑器”。
- **后端 API 层 (Backend API)**：基于 Nuxt 3 Nitro 引擎 (`server/api/`) 提供 RESTful API，处理前端的拉取、计算、策略执行等请求。
- **任务调度与执行层 (Task Scheduler)**：基于 `node-cron` 的后台任务调度系统 (`server/services/`)，处理每日/每小时的自动化数据抓取和监控。
- **策略与算法计算层 (Strategy Engine)**：核心算法引擎 (`utils/chartUtils.js` & `utils/algorithmUtils.js`)，支持 MA、MACD、KDJ 等指标计算，以及基于 AST（抽象语法树）的自定义多条件策略判定。
- **数据持久层 (Database)**：使用 MongoDB 和 Mongoose (`server/database/`)，存储股票数据(Stock)、任务(Task)、规则指标等。

---

## 2. 主要模块职责 (Main Module Responsibilities)

### 2.1 数据抓取与调度模块 (`server/fetchers/` & `server/services/`)
- **`dayLineFetcher.js` / `hourLineFetcher.js`**：负责对接外部股票数据源，抓取并更新本地数据库中的日线和小时线 K 线数据。
- **`scheduler.js` & `dailyTaskService.js`**：定时任务管理器。内置任务包括每日 16:30 拉取日线数据，以及每小时的第 5 分钟拉取小时线数据，并自动更新“重点关注(Focus)”股票状态。
- **`taskExecutor.js`**：任务执行器，负责将用户在前端配置的自定义策略打包为任务并执行回测。

### 2.2 策略回测模块 (`server/strategies/`)
- **`backtest.js`**：核心回测执行器 (`BacktestExecutor`)。它遍历股票库，调用 `chartUtils.calculateStock` 计算每只股票的技术指标和交易信号（买点、卖点），并统计总交易笔数、胜率、最大回撤等核心绩效指标。

### 2.3 算法与图表工具 (`utils/`)
- **`chartUtils.js`**：通用图表与指标计算库。包含计算移动平均线(MA)、MACD、KDJ 的核心逻辑，以及前复权计算。最关键的是 `calculateSignals` 和 `calculateTransactions` 方法，它们根据用户设定的买卖条件，在历史 K 线上模拟交易。
- **`algorithmUtils.js`**：策略规则库。内置了丰富的技术形态判断函数（如：均线金叉/死叉、MACD 顶底背离、KDJ 超买超卖等）。提供 `evaluateConditionTree` 函数用于解析前端传来的“条件树(AND/OR/NOT)”。

### 2.4 页面与组件 (`pages/` & `components/`)
- **`ConditionEditor.vue` & `TreeNodeEditor.vue`**：提供给用户的可视化条件树编辑器，支持无限嵌套的逻辑组合（AND/OR/NOT）。
- **`pages/index.vue` 及各类 Panel 组件**：系统的主要操作界面，分为图表展示区、股票列表区、策略配置区等。

---

## 3. 关键类与函数说明 (Key Classes and Functions)

| 模块/文件 | 核心函数/类 | 说明 |
| --- | --- | --- |
| `scheduler.js` | `startScheduler()` | 启动 Node.js 定时任务调度引擎 |
| `dailyTaskService.js` | `initDailyTasks()` | 初始化每日任务（如：16:30日线拉取，每小时05分小时线拉取） |
| `chartUtils.js` | `calculateMetric(data, config)` | 根据基础 K 线计算 MA, MACD, KDJ 等指标 |
| `chartUtils.js` | `calculateStock(props)` | 执行单只股票的全量回测：计算指标 -> 评估买卖信号 -> 生成交易记录 -> 统计胜率与回撤 |
| `algorithmUtils.js` | `evaluateConditionTree(node, data, idx)` | 递归解析 AST 条件树。例如解析 `AND(MACD金叉, 成交量放大)` 是否满足 |
| `backtest.js` | `BacktestExecutor.backtestAll()` | 遍历全库股票应用用户策略，并更新 MongoDB 的 `Task` 记录 |

---

## 4. 依赖关系 (Dependencies)

- **框架与运行时**：`nuxt` (Vue 3 全栈框架), `node`
- **数据持久化**：`mongoose` (MongoDB 对象建模工具)
- **定时调度**：`node-cron` (Cron 风格的后台任务)
- **可视化与 UI**：`@nuxt/ui` (前端组件库), `echarts`, `nuxt-tradingview` (专业 K 线图表)
- **核心计算**：`decimal.js` (解决 JavaScript 浮点数精度丢失问题，确保财务数据计算准确)

---

## 5. 项目运行方式 (How to Run)

1. **环境准备**：确保本地已安装 Node.js 和 MongoDB，并在 `.env` 或 `server/config/` 中配置好数据库连接。
2. **安装依赖**：
   ```bash
   npm install
   ```
3. **开发环境启动**：
   ```bash
   npm run dev
   ```
4. **启动定时调度器**（后台执行抓取和监控任务）：
   ```bash
   npm run scheduler:start
   ```
5. **手动抓取数据脚本**：
   - 抓取日线：`npm run fetch:daylines`
   - 抓取小时线：`npm run fetch:hourlines`

---

## 6. 针对您的自定义需求实现方案 (Implementation Guide for Your Goal)

**您的目标**：*“每天帮我快速地找出周线、日线、小时线的 DIF 都在 DEA 上的股票，并且这个规则可以自定义”*

目前项目已经具备了**极佳的扩展性**（AST 条件树支持任意逻辑组合，且已支持日线和小时线数据抓取），要实现您的目标，只需在现有架构上做如下开发：

### 第一步：增加基础的 DIF > DEA 规则因子
当前 `utils/algorithmUtils.js` 中有 MACD 金叉死叉等规则，但缺少纯粹的“DIF > DEA”状态判断。
**修改文件：** `utils/algorithmUtils.js` -> `availableConditions` 数组中追加：
```javascript
{ 
  value: 'MACD_DIF_GT_DEA', 
  label: 'MACD DIF大于DEA (多头)',
  params: ['macd'],
  func: (i, {dif, dea}) => dif[i] > dea[i]
}
```

### 第二步：增加“周线 (WeekLine)” 数据支持
项目目前有 `dayLine` 和 `hourLine`。
**修改步骤：**
1. 在 `server/database/models/stock.js` 的 Schema 中添加 `weekLine` 字段。
2. **（推荐）直接在后端聚合计算**：无需新建数据源 fetcher，可在 `utils/chartUtils.js` 中编写一个函数，将 `dayLine` 按周合并生成 `weekLine`（每周开盘价为周一开盘，收盘为周五收盘，最高最低取极值）。
3. 在 `calculateStock` 函数中，对合并出的 `weekLine` 调用 `calculateMetric` 生成周线的 MACD 数据。

### 第三步：支持跨周期（多级别）的策略树配置
目前的策略树编辑器 (`TreeNodeEditor.vue`) 和执行器 (`evalGroup` in `chartUtils.js`) 默认只针对单一周期的指标计算。
**修改步骤：**
1. **前端**：在 `TreeNodeEditor.vue` 中，为每个原子 Condition 增加一个“时间周期”下拉框（如：选择“日线”、“小时线”、“周线”），并将周期类型存入 node 对象（例如 `node.timeframe = 'week'`）。
2. **后端**：在 `utils/chartUtils.js` 的 `calculateSignals` 中，接收 `weekLineWithMetric`, `dayLineWithMetric`, `hourLineWithMetric`。
3. **引擎升级**：修改 `evalGroup`，使其根据 `node.timeframe` 动态传入对应级别的数据进行验证，而非写死使用 `dayLineWithMetric`。

**最终使用方式**：
在界面的【策略配置】弹窗中，您可以像搭积木一样配出：
```text
AND(
  条件1: [周线] MACD DIF大于DEA,
  条件2: [日线] MACD DIF大于DEA,
  条件3: [小时线] MACD DIF大于DEA
)
```
配好后点击执行，系统底层的 `BacktestExecutor` 就会自动跑遍全量股票，帮您把完全符合这三个周期共振的股票筛选出来。每日定时任务 (`scheduler.js`) 抓取完数据后，您也可以将此任务挂载为每日自动执行的扫描任务。