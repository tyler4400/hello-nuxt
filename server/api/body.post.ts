export default defineEventHandler(async (event) => {
  // 读取请求体
  const body = await readBody(event)
  return { body }
})
