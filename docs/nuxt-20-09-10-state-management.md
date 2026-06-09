# 第 20-9 / 20-10 节：状态管理（State Management）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 9 节 + 第 10 节（合并）
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节，核心差异同样是：约定目录在 **`app/`** 下。

---

## 1. 概述

前面学完路由与中间件，这一节（第 9、10 两节连续讲解）进入 **状态管理**。

Nuxt 没有像 Vue 那样依赖 Vuex / Pinia，而是内置了一个开箱即用的组合式函数 **`useState`** 来管理跨组件 / SSR 友好的全局状态。

两节课主线：
- **第 9 节**：用 `useState` 保存一个“当前用户”全局状态，串起登录流程与中间件鉴权；遗留一个痛点——每次都要手动传泛型。
- **第 10 节**：用 **composable 封装 `useState`** 解决类型推断痛点；再引入 **`callOnce`** 完成状态的异步初始化（并理解它其实运行在服务端）。

> ⚠️ 本节涉及的目录差异
> - 类型文件：课程放根目录 `types/user.ts`；我的项目放 **`app/types/user.ts`**，用别名 `~/types/user` 导入（`~` 在 Nuxt 4 指向 `app/`）。
> - composable：课程 `composables/`；我的项目 **`app/composables/`**。

---

## 2. 核心知识点 + 演示复盘（第 9 节：useState 入门）

### 2.1 `useState` 是什么

`useState` 是 Nuxt 内置的全局状态组合式函数，特点：

- **SSR 友好**：服务端渲染完成后，通过 hydration（注水）生成完整响应式对象。
- **初次渲染靠 JSON 序列化传递**：所以 **state 里不能存放无法 JSON 化的数据**，如 `class` 实例、`function`、`symbol`。
- **自动导入**：无需 import，直接用。

> ⚠️ Nuxt 4 差异：`useState` 本身用法与行为**不变**，SSR 友好、JSON 序列化限制都一致。

### 2.2 用 `useState` 初始化全局用户状态

`useState` 应在入口文件 `app.vue` 里初始化。它接收两个参数：

1. **key**：state 的唯一名称（务必全局唯一）。
2. **init**：一个**返回初始值的回调函数**（不能直接传值）。

```vue
<!-- 课程：app.vue ｜ 我的项目：app/app.vue -->
<script setup lang="ts">
// useState 是全局 composable，自动导入
const currentUser = useState('currentUser', () => {
  return {
    isLogin: false,
  }
})
</script>
```

### 2.3 用泛型 + interface 完善类型

此时 `currentUser.value` 只有 `isLogin` 字段。我们用 TypeScript 的 `interface` + 泛型完善它。先定义类型：

```ts
// 课程：types/user.ts ｜ 我的项目：app/types/user.ts
export interface User {
  isLogin: boolean
  // 未登录时没有用户名，所以是可选属性
  userName?: string
}
```

再把泛型灌进 `useState`：

```vue
<!-- app/app.vue -->
<script setup lang="ts">
import type { User } from '~/types/user'

// 传入泛型 User，currentUser.value 就有了完整类型
const currentUser = useState<User>('currentUser', () => {
  return {
    isLogin: false,
  }
})
</script>
```

> ⚠️ Nuxt 4 差异（类型文件位置与导入路径）
> - 课程把 `user.ts` 放根目录 `types/`，视频里用相对路径导入。
> - 我的项目放 `app/types/user.ts`，**推荐用别名导入 `~/types/user`**（`~` = `app/`），不受文件相对层级影响，更稳。

### 2.4 串起登录流程

在 `app.vue` 的模板里根据登录状态显示/隐藏内容，并加一个登录按钮：

```vue
<!-- app/app.vue -->
<script setup lang="ts">
import type { User } from '~/types/user'

const currentUser = useState<User>('currentUser', () => ({ isLogin: false }))

// 点击登录：写入状态并跳首页
const handleLogin = () => {
  currentUser.value.isLogin = true
  currentUser.value.userName = 'Viking'
  // navigateTo 是全局函数，自动导入
  navigateTo('/')
}
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <nav>
      <NuxtLink to="/">Home</NuxtLink>
      <!-- 已登录就不显示 login 链接 -->
      <NuxtLink v-if="!currentUser.isLogin" to="/login">Login</NuxtLink>
      <!-- 已登录则显示用户名 -->
      <span v-if="currentUser.isLogin">{{ currentUser.userName }}</span>
    </nav>
    <button @click="handleLogin">Login</button>
    <NuxtPage />
  </div>
</template>
```

> 说明：为演示方便，讲师把登录按钮直接放在 `app.vue`。真实项目里登录逻辑应放到 `login` 页面。

### 2.5 用全局状态改造中间件鉴权

回到第 7-8 节写的 `auth` 中间件，把之前“写死的假函数”换成真正的全局状态判断：

```ts
// 课程：middleware/auth.ts ｜ 我的项目：app/middleware/auth.ts
import type { User } from '~/types/user'

export default defineNuxtRouteMiddleware((to, from) => {
  // 在中间件里获取已初始化的全局状态（不传第二个参数，仅读取）
  const currentUser = useState<User>('currentUser')

  if (!currentUser.value.isLogin) {
    return navigateTo('/login')
  }
})
```

效果串联：未登录点击 `/users/1` → 被拦截跳 `/login` → 点登录 → 再点 `/users/1` 可进入。说明 `useState` 在 **组件、composable、中间件等任意位置都能拿到同一份全局状态**。

> 💡 第 9 节遗留痛点：每次用 `useState<User>(...)` 都要手动传泛型，无法自动推断。第 10 节解决它。

---

## 3. 核心知识点 + 演示复盘（第 10 节：composable 封装 + callOnce）

### 3.1 用 composable 封装 `useState`（解决类型痛点）

把 `useState` 的初始化封装进一个**自动导入的 composable**，类型只写一次，全应用复用：

```ts
// 课程：composables/useCurrentUser.ts ｜ 我的项目：app/composables/useCurrentUser.ts
import type { User } from '~/types/user'

// 封装成函数，return 初始化好的 useState
export const useCurrentUser = () => {
  return useState<User>('currentUser', () => {
    return {
      isLogin: false,
    }
  })
}
```

之后在任何地方直接用，无需再传泛型，类型自动推断：

```vue
<!-- app/app.vue -->
<script setup lang="ts">
// 一行搞定，类型自动带出（isLogin / userName 都有提示）
const currentUser = useCurrentUser()
</script>
```

```ts
// app/middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const currentUser = useCurrentUser()
  if (!currentUser.value.isLogin) {
    return navigateTo('/login')
  }
})
```

> 💡 通用经验：**任何需要全局共享的状态，都可以用「composable 封装 `useState`」的形式**，类型安全、使用方便。这是 Nuxt 里替代 Vuex/Pinia 处理简单全局态的标准做法。

> ⚠️ 新建 `app/composables/` 后需重启 dev server，类型才会生成（与第 5 节同理）。

### 3.2 `callOnce`：状态的异步初始化

很多时候初始状态需要**异步获取**（如携带 token 请求后端校验登录态、拿当前用户信息）。Nuxt 提供全局函数 **`callOnce`** 在入口处完成“只执行一次”的初始化。

```vue
<!-- app/app.vue -->
<script setup lang="ts">
const currentUser = useCurrentUser()

// 模拟一个异步请求（返回 Promise）
const getUserInfo = () => {
  return Promise.resolve({ userName: 'Viking' })
}

// callOnce：初始化时调用一次，完成异步初始化
await callOnce(async () => {
  console.log('init here')
  const info = await getUserInfo()
  currentUser.value.userName = info.userName
  currentUser.value.isLogin = true
})
</script>
```

刷新页面，发现已是登录态、显示 `Viking`，说明异步初始化成功。

### 3.3 关键认知：`callOnce` 运行在服务端

讲师特意验证：在 `callOnce` 里 `console.log('init here')`——

- **浏览器 console 里看不到** `init here`；
- **终端（服务端）里能看到** `init here`。

这说明：Nuxt 是前后端一体框架，**这段“看起来像前端”的初始化代码实际在服务端执行**。要跳出传统 SPA “在 `onMounted` 里请求”的思维。

> ⚠️ Nuxt 4 差异（`callOnce` 新增 `mode` 选项）
> 课程用的是默认行为；Nuxt 4（自 3.15 起）给 `callOnce` 增加了第二/第三参数的 `options.mode`：
>
> | mode | 行为 |
> | --- | --- |
> | `'render'`（默认） | 整个应用生命周期**仅执行一次**（SSR 执行了，客户端就不再执行；返回该页也不再执行） |
> | `'navigation'` | 初次渲染执行一次，**之后每次客户端导航都再执行一次** |
>
> ```ts
> // 需要每次导航都重新初始化时：
> await callOnce(async () => {
>   // ...
> }, { mode: 'navigation' })
> ```
>
> 讲师的写法等价于默认 `{ mode: 'render' }`，行为与 Nuxt 4 一致；只是 Nuxt 4 多了 `navigation` 这个可选项。
> 另：`callOnce` 不返回任何值；要在 SSR 期间做数据获取，应使用 `useAsyncData` / `useFetch`（见数据获取篇）。

---

## 4. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7） |
| --- | --- | --- |
| `useState(key, init)` | 全局状态 | 不变 |
| SSR 友好 / JSON 序列化限制 | 是 | 不变 |
| composable 封装全局状态 | `composables/useCurrentUser.ts` | `app/composables/useCurrentUser.ts` |
| 类型文件 | `types/user.ts` | `app/types/user.ts`（用 `~/types/user` 导入） |
| 中间件读状态 | `middleware/auth.ts` | `app/middleware/auth.ts` |
| `callOnce(fn)` | 仅“只执行一次” | 新增 `options.mode`：`render`（默认）/ `navigation` |
| `navigateTo` | 跳转 | 不变（须 `return` 用于中间件） |

> 结论：状态管理这两节，Nuxt 4 的实质变化只有 **`callOnce` 多了 `mode` 选项**；其余 API 与写法一致，差异都在“目录挪到 `app/`”。

---

## 5. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。前置：已完成路由/中间件篇的 pages 与 `auth` 中间件。

1. 新建类型 `app/types/user.ts`，写入 `User`（2.3）。
2. 编辑 `app/app.vue`：用 `useState<User>('currentUser', () => ({ isLogin: false }))` 初始化，加导航条与登录按钮（2.4）。
3. 改造 `app/middleware/auth.ts`：用 `useState<User>('currentUser')` 读状态判断（2.5）。
4. 验证登录流程：未登录点 `/users/1` → 跳 `/login` → 点登录 → 再点 `/users/1` 能进入。
5. 新建 `app/composables/useCurrentUser.ts` 封装（3.1），**重启 dev server**：

```bash
npm run dev
```

6. 把 `app.vue` 和 `auth.ts` 改用 `const currentUser = useCurrentUser()`，确认类型自动推断。
7. 在 `app.vue` 用 `callOnce` 做异步初始化（3.2），并在回调里 `console.log('init here')`。
8. 刷新页面，确认终端（不是浏览器）打印 `init here`，体会 SSR 执行（3.3）。

---

## 6. 易错点 + 关键 API 速查

### 易错点

- **`useState` 第二个参数是“返回初始值的函数”**，不是直接传值：`useState('k', () => ({...}))`。
- **key 必须全局唯一**：多处用同一 key 即共享同一份状态（这正是跨组件共享的原理）。
- **state 不能存非 JSON 数据**：`class` / `function` / `symbol` 会在 SSR 序列化时出问题。
- **中间件里读状态**：用 `useState<User>('currentUser')`（不传 init），或用封装好的 `useCurrentUser()`。
- **新建 `app/composables/` / `app/types/` 后重启 dev server**。
- **`callOnce` 不返回值**：它只负责“执行一次”，数据获取要用 `useAsyncData`/`useFetch`。
- **`callOnce` 默认在服务端执行一次**：别套用“`onMounted` 里请求”的 SPA 思维。

### 关键 API / 概念速查

| 名称 | 作用 | 说明 |
| --- | --- | --- |
| `useState(key, init)` | 全局响应式状态 | SSR 友好；`init` 为返回初始值的函数 |
| `useState<T>(...)` | 带类型的状态 | 第 9 节每次手传泛型的痛点 |
| composable 封装 `useState` | 类型安全的全局态 | 第 10 节最佳实践，自动导入 |
| `callOnce(fn, options?)` | 只执行一次的初始化 | Nuxt 4 新增 `mode: 'render' \| 'navigation'` |
| `app/types/`（课程 `types/`） | 类型定义目录 | 用 `~/types/...` 导入 |

---

> 小结：①`useState(key, () => init)` 做 SSR 友好的全局状态；②用「composable 封装 `useState`」解决泛型痛点、实现类型安全全局态；③`callOnce` 做异步初始化且运行在服务端；④Nuxt 4 仅 `callOnce` 多了 `mode` 选项，其余只是目录挪到 `app/`。
