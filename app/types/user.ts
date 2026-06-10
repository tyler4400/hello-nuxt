export interface User {
  isLoggedIn: boolean
  // 未登录时没有用户名，所以是可选属性
  userName?: string
  userId?: string
}

export interface UserData {
  id: number
  name: string
  username: string
  email: string
}

export interface PostData {
  id: number
  userId: number
  title: string
  body: string
}
