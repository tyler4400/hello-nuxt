// 在 server/plugins/ 下建文件即自动注册

// 💡 用途：如果要在应用启动时初始化第三方库/工具，或在请求生命周期统一插入逻辑（日志、监控、统一处理），用 Nitro 插件很合适。
export default defineNitroPlugin((nitroApp) => {
  // nitroApp 是 NitroApp 类型——整个后端实例
  // console.log(nitroApp)

  // 请求开始时
  nitroApp.hooks.hook('request', (event) => {
    // event 是 H3Event（与写接口时同一个事件对象）
    console.log('on request', event.path)
  })

  // 响应返回前
  nitroApp.hooks.hook('beforeResponse', (event, response) => {
    // 第二参可拿到将要返回的数据 response.body
    console.log('on response', event.path, response.body)
  })
})
