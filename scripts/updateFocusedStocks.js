import { updateFocusedStocks } from '../server/services/focusService.js';
import logger from '../utils/logger.js';

/**
 * 更新所有股票的关注天数脚本
 */
async function main() {
    try {
        logger.info('开始执行股票关注天数更新脚本');
        
        const result = await updateFocusedStocks();
        
        logger.info('股票关注天数更新完成:', result);
        console.log('更新结果:', JSON.stringify(result, null, 2));
        
        process.exit(0);
    } catch (error) {
        logger.error('更新股票关注天数失败:', error);
        console.error('错误:', error.message);
        process.exit(1);
    }
}

main();