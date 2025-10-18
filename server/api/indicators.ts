import MongoDB from '../database/mongo.js'

export default defineEventHandler(async (event) => {
  try {
    const method = getMethod(event)

    if (method === 'GET') {
      const query = getQuery(event)
      const { page = 1, pageSize = 20, search = '', sortBy = 'code', sortOrder = 'asc' } = query
      const result = await MongoDB.getIndicators(Number(page), Number(pageSize), String(search), String(sortBy), String(sortOrder))
      return result
    }

    if (method === 'POST') {
      const body = await readBody(event)
      if (!body || !body.name || !body.code) {
        throw createError({ statusCode: 400, statusMessage: 'name 和 code 必填' })
      }
      const payload = {
        name: String(body.name),
        code: String(body.code),
        usedIndicators: Array.isArray(body.usedIndicators) ? body.usedIndicators.map(String) : [],
        calcMethod: body.calcMethod ? String(body.calcMethod) : '',
        calcParams: body.calcParams ?? {},
        group: body.group ? String(body.group) : '',
      }
      const created = await MongoDB.createIndicator(payload)
      return created
    }

    if (method === 'PATCH') {
      const body = await readBody(event)
      const { code } = body
      if (!code) {
        throw createError({ statusCode: 400, statusMessage: '缺少 code' })
      }
      const updateData: any = {}
      if (body.name !== undefined) updateData.name = String(body.name)
      if (body.usedIndicators !== undefined) updateData.usedIndicators = Array.isArray(body.usedIndicators) ? body.usedIndicators.map(String) : []
      if (body.calcMethod !== undefined) updateData.calcMethod = String(body.calcMethod)
      if (body.calcParams !== undefined) updateData.calcParams = body.calcParams
      if (body.group !== undefined) updateData.group = String(body.group)
      const updated = await MongoDB.updateIndicator(String(code), updateData)
      return updated
    }

    if (method === 'DELETE') {
      const query = getQuery(event)
      const { code } = query
      if (!code) {
        throw createError({ statusCode: 400, statusMessage: '缺少 code' })
      }
      const result = await MongoDB.deleteIndicator(String(code))
      return result
    }

    throw createError({ statusCode: 405, statusMessage: 'Method Not Allowed' })
  } catch (error: any) {
    console.error('指标API错误:', error)
    throw createError({ statusCode: 500, statusMessage: error.message || '指标API内部错误' })
  }
})