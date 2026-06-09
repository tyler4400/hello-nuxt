// 判断是否已登录；真实项目里会请求接口（异步），这里先写死试验
const isAuthenticated = (id: any): boolean => {
  if (id === 'forbidden') {
    return false
  }
  return true
}

// 必须用全局函数 defineNuxtRouteMiddleware 包裹一个回调
// 回调参数 to（目标路由）、from（来源路由），与路由守卫一致
export default defineNuxtRouteMiddleware((to, from) => {
  if (!isAuthenticated(to.params.id)) {
    alert('😱 Oh no, 没有权限，跳至登录页.')
    // 没权限就跳转到 login；注意：navigateTo 必须 return
    return navigateTo('/login')
  }
})
