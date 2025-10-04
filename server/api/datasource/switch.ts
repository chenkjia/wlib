import MongoDB from '~/server/database/connection.js';

export default defineEventHandler(async (event) => {
    try {
        const body = await readBody(event);
        const { dataSource } = body;

        if (!dataSource || !['flib', 'alib'].includes(dataSource)) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Invalid dataSource. Must be "flib" or "alib"'
            });
        }

        // 设置全局数据源
        await MongoDB.setDataSource(dataSource);
        
        // 重新连接到新的数据库
        await MongoDB.connect();

        return {
            success: true,
            message: `Successfully switched to ${dataSource} database`,
        };
    } catch (error: any) {
        console.error('Switch datasource error:', error);
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to switch datasource: ${error.message}`
        });
    }
});