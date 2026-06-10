// 必须用全局函数 defineNuxtRouteMiddleware 包裹一个回调
// 回调参数 to（目标路由）、from（来源路由），与路由守卫一致
export default defineNuxtRouteMiddleware((to, from) => {
  const currentUser = useCurrentUser()
  if (!currentUser.value?.isLoggedIn) {
    const isOk = window?.confirm?.('😱 Oh no, 没有登录，跳至登录页吗.')
    console.log('/isOk: ', isOk);
    // 没权限就跳转到 login；注意：navigateTo 必须 return
    if(isOk) {
      return navigateTo('/login')
    } else {
      return abortNavigation()
    }
  }
})
