// server/api/ 下的路由会自动加 /api 前缀；若想要不带 /api 前缀的路由，放到 server/routes/ 下

export default defineEventHandler((event) => {
  // The handler can directly return JSON data, a Promise, or use event.node.res.end() to send a response.
  // return { name: 'jack' }
  // return Promise.resolve({ name: 'promise' })
  return event.node.res.end('event.node.res.end')
})
