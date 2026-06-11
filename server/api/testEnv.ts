export default defineEventHandler((event) => {

  // Nuxt 4 推荐在 server 端传入 event，确保拿到环境变量覆盖后的值
  const config = useRuntimeConfig(event)
  console.log('apiKey', config.apiKey) // 后端能打印出 1234
  return { ok: true }
})
