// server/plugins/storage.ts
import redisDriver from 'unstorage/drivers/redis'

export default defineNitroPlugin(() => {
  // 插件内可用组合式函数：拿到 runtimeConfig（已被 .env 覆盖）
  const config = useRuntimeConfig()
  const storage = useStorage()

  // 手动创建 redis 驱动
  const driver = redisDriver({
    // base: 'redis', // 可选：存取时自动加前缀，便于区分
    host: config.redis.host,
    port: config.redis.port,
  })

  // 挂载到名为 'redis' 的挂载点（与之前使用处保持一致）
  storage.mount('redis', driver)
})
