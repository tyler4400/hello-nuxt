export interface User {
  isLoggedIn: boolean
  // 未登录时没有用户名，所以是可选属性
  userName?: string
  userId?: string
}
