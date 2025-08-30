# 定时任务和数据拉取系统使用指南

## 功能概述

本系统提供了完整的定时任务和数据拉取功能：

- **自动定时任务**: 
  - 每天下午4点半自动执行日线数据拉取
  - 每小时第5分钟自动执行小时线数据拉取
- **手动执行工具**: 提供命令行工具手动触发数据拉取
- **任务管理**: 支持任务的启动、停止、状态查询
- **错误处理**: 完善的错误处理和日志记录

## 使用方法

### 启动和查看定时任务

#### 启动定时任务调度器
```bash
# 启动所有定时任务
npm run scheduler:start
```

#### 查看任务状态
```bash
# 查看当前任务状态
npm run scheduler:status
```

### 手动执行数据拉取

#### 执行日线数据拉取
```bash
# 正常执行
npm run fetch:daylines

# 强制更新所有数据
npm run fetch:daylines --force

# 查看帮助
npm run fetch:daylines --help
```

#### 执行小时线数据拉取
```bash
# 正常执行
npm run fetch:hourlines

# 强制更新所有数据
npm run fetch:hourlines --force

# 查看帮助
npm run fetch:hourlines --help
```

### 查看帮助信息

```bash
# 查看定时任务调度器帮助
npm run scheduler:start -- --help

# 查看日线数据拉取帮助
npm run fetch:daylines -- --help

# 查看小时线数据拉取帮助
npm run fetch:hourlines -- --help
```

## 系统架构

### 系统架构

```
定时任务系统/
├── services/
│   ├── scheduler.js          # 定时任务调度器核心
│   └── dailyTaskService.js   # 日常任务服务
├── scripts/
│   ├── startScheduler.js     # 启动定时任务脚本
│   ├── fetchDayLines.js      # 手动日线数据拉取脚本
│   └── fetchHourLines.js     # 手动小时线数据拉取脚本
└── fetchers/
    ├── dayLineFetcher.js     # 日线数据拉取逻辑
    └── hourLineFetcher.js    # 小时线数据拉取逻辑
```

## 定时任务配置

### 当前配置的任务

1. **日线数据拉取任务**
   - 任务ID: `daily-dayline-fetch`
   - 执行时间: 每天下午4点半 (16:30)
   - Cron表达式: `30 16 * * *`
   - 功能: 自动拉取所有加密货币的日线数据

2. **小时线数据拉取任务**
   - 任务ID: `hourly-hourline-fetch`
   - 执行时间: 每小时第5分钟
   - Cron表达式: `5 * * * *`
   - 功能: 自动拉取所有加密货币的小时线数据

### Cron表达式说明

```
格式: 分 时 日 月 周

示例:
30 16 * * *  # 每天16:30执行
5 * * * *    # 每小时第5分钟执行
0 */2 * * *  # 每2小时执行一次
0 9-17 * * 1-5  # 工作日9-17点每小时执行
```

## 日志和监控

### 日志位置
- 系统日志会输出到控制台
- 详细的执行日志可通过logger模块查看

### 监控要点
- 定时任务是否正常启动
- 数据拉取是否成功完成
- 是否有错误或异常发生

## 注意事项

1. **数据库连接**: 系统会自动处理数据库连接，无需手动连接
2. **时区设置**: 定时任务使用中国时区 (Asia/Shanghai)
3. **错误处理**: 单个币种拉取失败不会影响其他币种的处理
4. **资源管理**: 系统会自动管理API请求频率，避免超出限制

## 故障排除

### 常见问题

1. **定时任务未启动**
   - 检查是否正确执行了 `npm run scheduler:start`
   - 查看控制台是否有错误信息

2. **数据拉取失败**
   - 检查网络连接
   - 验证API密钥是否有效
   - 查看数据库连接状态

3. **任务重复执行**
   - 确保只启动了一个调度器实例
   - 检查任务ID是否重复

### 调试方法

```bash
# 查看任务状态
npm run scheduler:status

# 手动测试数据拉取
npm run fetch:daylines
npm run fetch:hourlines

# 查看详细日志
# 日志会输出到控制台，注意观察错误信息
```

## 扩展功能

### 添加新的定时任务

1. 在 `dailyTaskService.js` 中添加新任务
2. 使用 `addTask` 函数注册任务
3. 重启调度器使配置生效

### 修改执行时间

1. 修改对应任务的Cron表达式
2. 重启调度器应用新配置

### 自定义数据拉取逻辑

1. 在 `fetchers/` 目录下创建新的拉取器
2. 在任务服务中引入并使用
3. 添加对应的命令行脚本

---

**技术支持**: 如遇问题，请查看日志输出或联系开发团队。