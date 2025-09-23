// 创建浏览器和服务器端通用的日志工具
const logger = {
  info: (message, ...args) => {
    if (typeof window !== 'undefined') {
      console.info(`[INFO] ${message}`, ...args);
    } else {
      console.info(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message, ...args) => {
    if (typeof window !== 'undefined') {
      console.warn(`[WARN] ${message}`, ...args);
    } else {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message, ...args) => {
    if (typeof window !== 'undefined') {
      console.error(`[ERROR] ${message}`, ...args);
    } else {
      console.error(`[ERROR] ${message}`, ...args);
    }
  },
  debug: (message, ...args) => {
    if (typeof window !== 'undefined') {
      console.debug(`[DEBUG] ${message}`, ...args);
    } else {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};

export default logger;