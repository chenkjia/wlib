/**
 * 计算结果API
 * 用于保存和获取计算结果
 */

import { defineEventHandler, readBody, getQuery, createError } from 'h3'
import { MongoClient } from 'mongodb'

// MongoDB连接
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017')
const dbName = 'wlib'
const collectionName = 'calculation_results'

// 连接数据库
async function connectToDatabase() {
  await client.connect()
  return client.db(dbName).collection(collectionName)
}

export default defineEventHandler(async (event) => {
  // 获取HTTP方法
  const method = event.node.req.method
  
  // 处理POST请求 - 保存计算结果
  if (method === 'POST') {
    try {
      const body = await readBody(event)
      const { taskId, result } = body
      
      if (!taskId || !result) {
        throw createError({
          statusCode: 400,
          statusMessage: '缺少必要参数'
        })
      }
      
      // 添加时间戳
      const document = {
        taskId,
        result,
        createdAt: new Date()
      }
      
      // 连接数据库并保存
      const collection = await connectToDatabase()
      const response = await collection.insertOne(document)
      
      return {
        success: true,
        id: response.insertedId,
        message: '计算结果已保存'
      }
    } catch (error) {
      console.error('保存计算结果失败:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '保存计算结果失败: ' + error.message
      })
    }
  }
  
  // 处理GET请求 - 获取计算结果
  if (method === 'GET') {
    try {
      const { taskId, page = 1, pageSize = 10 } = getQuery(event)
      
      // 连接数据库
      const collection = await connectToDatabase()
      
      // 构建查询条件
      const query = taskId ? { taskId } : {}
      
      // 计算分页
      const skip = (parseInt(page) - 1) * parseInt(pageSize)
      const limit = parseInt(pageSize)
      
      // 查询数据
      const results = await collection
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray()
      
      // 获取总数
      const total = await collection.countDocuments(query)
      
      return {
        success: true,
        data: results,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    } catch (error) {
      console.error('获取计算结果失败:', error)
      throw createError({
        statusCode: 500,
        statusMessage: '获取计算结果失败: ' + error.message
      })
    }
  }
  
  // 不支持的方法
  throw createError({
    statusCode: 405,
    statusMessage: '不支持的请求方法'
  })
})