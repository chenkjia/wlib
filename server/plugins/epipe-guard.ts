export default defineNitroPlugin(() => {
  const globalKey = '__wlibEpipeGuardInstalled__'
  if ((globalThis as any)[globalKey]) return
  ;(globalThis as any)[globalKey] = true

  const isEpipeError = (value: any) => {
    const code = String(value?.code || '')
    const message = String(value?.message || '')
    return code === 'EPIPE' || message.includes('write EPIPE')
  }

  process.on('unhandledRejection', (reason) => {
    if (isEpipeError(reason)) {
      console.warn('[nitro] 忽略已断开连接导致的 EPIPE unhandledRejection')
      return
    }
    console.error('[nitro] unhandledRejection:', reason)
  })

  process.on('uncaughtException', (error) => {
    if (isEpipeError(error)) {
      console.warn('[nitro] 忽略已断开连接导致的 EPIPE uncaughtException')
      return
    }
    console.error('[nitro] uncaughtException:', error)
  })
})
