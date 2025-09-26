import { defineEventHandler, getRouterParam, readBody } from 'h3'
import MongoDB from '~/server/database/mongo'

/**
 * 更新任务信息的API路由
 * 处理PATCH请求，用于更新任务的名称等信息
 */
export default defineEventHandler(async (event) => {
  try {
    // 获取任务ID
    const taskId = getRouterParam(event, 'taskId')
    if (!taskId) {
      return {
        statusCode: 400,
        body: { error: '缺少任务ID' }
      }
    }

    // 获取请求体
    const body = await readBody(event)
    if (!body || Object.keys(body).length === 0) {
      return {
        statusCode: 400,
        body: { error: '请求体不能为空' }
      }
    }

    // 目前只支持更新任务名称
    const { name } = body
    if (!name) {
      return {
        statusCode: 400,
        body: { error: '任务名称不能为空' }
      }
    }

    // 调用数据库方法更新任务
    const updatedTask = await MongoDB.updateTask(taskId, { name })
    
    return {
      statusCode: 200,
      body: updatedTask
    }
  } catch (error: any) {
    console.error('更新任务失败:', error)
    return {
      statusCode: 500,
      body: { error: error.message || '更新任务失败' }
    }
  }
})