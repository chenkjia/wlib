import GoalDB from '../database/goal.js'
import { Goal } from '../database/models/goal.js'

export default defineEventHandler(async (event) => {
  const method = getMethod(event)
  
  if (method === 'GET') {
    try {
      const query = getQuery(event)
      const { 
        page = 1, 
        pageSize = 20, 
        stockCode = '', 
        sortBy = 'startTime', 
        sortOrder = 'desc' 
      } = query
      
      // 构建查询条件
      let filter: any = {}
      if (stockCode) {
        filter.stockCode = stockCode
      }
      if (event.node.req.url?.includes('trendCategory=')) {
        const url = new URL(event.node.req.url, 'http://localhost')
        const trendCategory = url.searchParams.get('trendCategory')
        if (trendCategory && trendCategory !== 'all') {
          filter.trendCategory = trendCategory
        }
      }
      
      // 构建排序条件
      const sort: any = {}
      const sortField = String(sortBy)
      sort[sortField] = sortOrder === 'desc' ? -1 : 1
      
      // 计算跳过的文档数量
      const skip = (Number(page) - 1) * Number(pageSize)
      
      // 使用Promise.all并行执行查询总数和查询数据
      const [total, goals] = await Promise.all([
        // 查询总数
        Goal.countDocuments(filter),
        
        // 查询当前页的数据
        Goal.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(Number(pageSize))
          .lean()
      ])
      
      // 计算总页数
      const totalPages = Math.ceil(total / Number(pageSize))
      
      return {
        data: goals,
        total,
        page: Number(page),
        pageSize: Number(pageSize),
        totalPages
      }
    } catch (error: any) {
      throw createError({
        statusCode: 500,
        statusMessage: '获取目标列表失败: ' + error.message
      })
    }
  }
  
  throw createError({
    statusCode: 405,
    statusMessage: 'Method Not Allowed'
  })
})