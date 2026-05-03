import MongoDB from '../../database/mongo.js'

export default defineEventHandler(async (event) => {
  try {
    await MongoDB.connect()
    if (getMethod(event) !== 'POST') {
      return { success: false, message: '仅支持POST请求' }
    }
    const body = await readBody(event)
    const action = String(body?.action || '').trim()

    if (action === 'add') {
      const codes = Array.isArray(body?.codes) ? body.codes : []
      const result = await MongoDB.addToWatchlist(codes)
      return { success: true, data: result }
    }

    if (action === 'clear') {
      const result = await MongoDB.clearWatchlist()
      return { success: true, data: result }
    }

    return { success: false, message: '无效操作类型' }
  } catch (error: any) {
    return { success: false, message: error?.message || '观察列表操作失败' }
  }
})
