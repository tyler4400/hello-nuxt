// server/api/users/[id].ts  →  /api/users/:id
export default defineEventHandler((event) => {
  // 推荐用内置函数获取单个路由参数（更快捷、更安全）
  // 也可以从 event.context.params 上拿：
  // const id = event.context.params?.id
  const id = getRouterParam(event, 'id')

  const query = getQuery(event)

  return { id, query }
})
