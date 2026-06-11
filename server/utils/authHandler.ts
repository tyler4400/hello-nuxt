// server/utils/authHandler.ts
import type { EventHandler } from 'h3'

// 高阶函数：包装一个 handler，在请求前后加处理
export const defineAuthResponseHandler = (handler: EventHandler) => {
  return defineEventHandler(async (event) => {
    // ===== before the route handler：原始 handler 之前 =====
    // 想重复利用的逻辑（如鉴权）写在这里
    const user = await Promise.resolve({ isLogin: false })
    if (!user.isLogin) {
      throw createError({ statusCode: 401, statusMessage: 'unauthorized ~!!!' })
    }

    // ===== 执行原始 handler =====
    const response = await handler(event)

    // ===== after the route handler：原始 handler 之后 =====
    // 想在响应后做的处理写在这里（如统一包裹、日志）
    return { ...response }
  })
}
