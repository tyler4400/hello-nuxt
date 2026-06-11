export default defineEventHandler(async (event) => {
  // 取出请求体里的 name
  const body = await readBody<{ userName: string }>(event)
  const currentUser = { userName: body.userName }

  // useStorage() 返回 unstorage 实例（全局函数，server 端自动可用）
  // setItem(key, value)：最常用的写入方法
  await useStorage().setItem('currentUser', currentUser)

  return currentUser
})
