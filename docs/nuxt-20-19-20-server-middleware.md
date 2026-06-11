# 第 20-19 / 20-20 节：服务器端中间件（Server Middleware 与路由保护）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 19 节 + 第 20 节（合并）
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节；server 基础见 `nuxt-20-18-server-basics.md`。

---

## 1. 概述

这两节讲**服务端中间件**，以及由它延伸出的多种“路由保护”写法。核心是体会 **Nitro / H3 极简的中间件设计**——比 Egg.js / Koa 简单很多。

> ⚠️ 先区分两个 middleware（容易混淆）
> - **前端路由中间件**（`app/middleware/`）：本质是 vue-router 路由守卫，见 `nuxt-20-07-08`。
> - **服务端中间件**（`server/middleware/`）：在**每个 server 请求、真正路由处理之前**执行，类似 Egg/Koa 的中间件。本篇讲的是后者。

两节主线：
- **第 19 节**：`server/middleware/` 写日志与鉴权中间件；`createError` 抛错；中间件对**所有**路由生效的问题，及两种“按路由保护”的变通方式（`event.path` 判断 / 抽象成普通函数）。
- **第 20 节**：引入 **`server/utils/` 自动导入**，用**高阶函数**封装一个更灵活的 `defineAuthResponseHandler`（可在请求前后加处理，类似装饰器）。

> ⚠️ Nuxt 4 结构差异（贯穿全篇）：`server/middleware/`、`server/utils/` 都在**项目根的 `server/` 下**（不进 `app/`）；引用 server 内部文件用 `~~/server/...` 或新别名 `#server`（`~` 在 Nuxt 4 指 `app/`）。

---

## 2. 核心知识点 + 演示复盘（第 19 节）

### 2.1 服务端中间件基础

在 `server/middleware/` 下建任意文件即自动执行，**在真正路由处理之前、每个请求都跑**，**不需要返回任何东西**，直接写逻辑即可。

第一个中间件——打印每个请求的 URL：

```ts
// server/middleware/log.ts
export default defineEventHandler((event) => {
  // getRequestURL 是 H3 内置全局函数，取本次请求 URL
  console.log('new request', getRequestURL(event))
})
```

访问任意 `/api/...` 路由，终端都会打印 `new request` 与地址，说明它对所有路由生效。

> ⚠️ Nuxt 4 差异：`server/middleware/` 位置（项目根）与行为不变；`defineEventHandler` / `getRequestURL` 用法不变。

### 2.2 鉴权中间件 + `createError` 抛错

最典型的中间件是“路由保护”。先写一个（用假数据）：

```ts
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  // 假数据，模拟从 token / session 取到的用户
  const user = await Promise.resolve({ isLogin: false, userName: 'viking' })
  console.log(user)

  if (!user.isLogin) {
    // 未登录：抛出自定义错误
    throw createError({
      statusCode: 401,
      message: 'unauthorized',
    })
  }
})
```

错误状态码规则（重要知识点）：

| 情况 | 返回 |
| --- | --- |
| 没有抛出任何错误 | `200 OK` |
| 抛出**未捕获**的错误 | `500 Internal Server Error` |
| 用 `createError` 抛出自定义错误 | 自定义状态码（如 `401`） |

行为差异：
- **ajax 请求**（如前端 `$fetch`）触发 → 返回 **JSON** 错误。
- **直接在浏览器访问页面** → 返回一个**定制化错误页**（后续可自定义）。

> ⚠️ Nuxt 4 差异（`createError` 字段）
> 讲师用 `{ statusCode, message }`，在 Nuxt 4 **仍然有效**。
> 不过 Nuxt 4 官方文档新示例倾向用 `{ status, statusText }`（两者是别名，可互换）。标准字段是 `statusCode` + `statusMessage`，`message` 也可用。照讲师写法即可。

### 2.3 中间件执行顺序

多个中间件**按文件名字母序**执行：`auth.ts`（a）先于 `log.ts`（l）。要改顺序，加**数字前缀**：

```text
server/middleware/
├─ 01.auth.ts     # 先执行
├─ 02.log.ts      # 后执行
```

> ⚠️ 重要细节（讲师未强调）：文件名是按**字符串**排序，不是数值。`10.x.ts` 会排在 `2.x.ts` 前面。所以单位数要补零写成 `01.`、`02.`，避免顺序错乱。这点与前端全局中间件一致。

### 2.4 问题：中间件对所有路由生效

上面的 `auth` 会拦截**所有** server 路由。但我们通常只想保护部分路由。Nitro / H3 **没有**内置的“按路由分配中间件”功能，于是有两种变通方式。

#### 方式一：在中间件里用 `event.path` 甄别

```ts
// server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  // 只保护以 /api/users 开头的路由，其余直接放行
  if (!event.path.startsWith('/api/users')) {
    return
  }

  const user = await Promise.resolve({ isLogin: false })
  if (!user.isLogin) {
    throw createError({ statusCode: 401, message: 'unauthorized' })
  }
})
```

此时访问 `/api/test` 放行，`/api/users/1` 才会被鉴权。

> ⚠️ Nuxt 4 差异：`event.path` 用法不变。

#### 方式二：抽象成普通函数（极简思路）

干脆不用中间件，把保护逻辑抽成一个普通函数，在需要的路由里手动调用：

```ts
// server/protectedRoute.ts
import type { H3Event } from 'h3'

// event 类型来自 h3
export const protectedRoute = async (event: H3Event) => {
  const user = await Promise.resolve({ isLogin: false })
  if (!user.isLogin) {
    throw createError({ statusCode: 401, message: 'unauthorized' })
  }
}
```

在具体路由里使用：

```ts
// server/api/users/[id].ts
// ⚠️ Nuxt 4：用 ~~/server 或 #server，别用 ~/server（~ 指 app/）
import { protectedRoute } from '~~/server/protectedRoute'

export default defineEventHandler(async (event) => {
  // 想保护哪个路由，就在开头调用它
  await protectedRoute(event)

  const id = getRouterParam(event, 'id')
  return { id }
})
```

> ⚠️ Nuxt 4 差异（导入别名，重点）
> 课程把 `protectedRoute.ts` 放 `server/` 下并用 `~/server/protectedRoute` 导入（Nuxt 3 的 `~` 指项目根）。
> 在 **Nuxt 4**，`~` 指 `app/`，所以必须改用 **`~~/server/protectedRoute`** 或新别名 **`#server/protectedRoute`**（`#server` 是 Nuxt 4 为 server 目录新增的别名，仅能在 `server/` 内使用）。
> 当然，更推荐把它放到 `server/utils/` 自动导入（见第 20 节），就完全不用 import 了。

---

## 3. 核心知识点 + 演示复盘（第 20 节：server/utils + 高阶函数）

### 3.1 `server/utils/` 自动导入

`utils/` 是又一个支持**自动导入**的约定目录，放置“杂七杂八的帮助函数”。它与 `composables/` 的区别：

| 目录 | 放什么 |
| --- | --- |
| `composables/` | 用到 Vue 响应式的组合式函数 |
| `utils/` | 与响应式无关的普通帮助函数 |

server 端同样支持：在 **`server/utils/`** 下的函数会被**自动导入**（server 上下文内），无需 import。

> ⚠️ Nuxt 4 差异：
> - 前端 utils 目录是 `app/utils/`；**server utils 是项目根的 `server/utils/`**。
> - `server/utils/` 自动导入在 Nuxt 3 / 4 都支持，行为不变。

### 3.2 用高阶函数封装鉴权（更灵活）

`defineEventHandler` 返回的就是一个普通的 `EventHandler`。于是我们可以写一个**高阶函数**去包装它：接收用户的 handler，在其**前后**插入自己的逻辑，再返回一个 `defineEventHandler`。

`server/utils/` 接受两种导出：
- **具名导出**：直接用该名称的函数。
- **默认导出**：函数名与文件名相关。

这里用**具名导出**：

```ts
// server/utils/authHandler.ts
import type { EventHandler } from 'h3'

// 高阶函数：包装一个 handler，在请求前后加处理
export const defineAuthResponseHandler = (handler: EventHandler) => {
  return defineEventHandler(async (event) => {
    // ===== before the route handler：原始 handler 之前 =====
    // 想重复利用的逻辑（如鉴权）写在这里
    const user = await Promise.resolve({ isLogin: false })
    if (!user.isLogin) {
      throw createError({ statusCode: 401, message: 'unauthorized' })
    }

    // ===== 执行原始 handler =====
    const response = await handler(event)

    // ===== after the route handler：原始 handler 之后 =====
    // 想在响应后做的处理写在这里（如统一包裹、日志）
    return { ...response }
  })
}
```

使用时，把原来的 `defineEventHandler` 换成 `defineAuthResponseHandler` 即可（`server/utils/` 自动导入，无需 import）：

```ts
// server/api/users/[id].ts
export default defineAuthResponseHandler((event) => {
  const id = getRouterParam(event, 'id')
  return { id }
})
```

效果：`/api/users/1` 会先经过鉴权（未登录返回 401），普通路由（如 `/api/test`）不受影响。

> 💡 这有点像 Egg.js 里重度使用的 **decorator（装饰器）**，但更好懂。需要在请求前后重复添加逻辑（如验证）时，是很棒的手段。
> ⚠️ Nuxt 4 差异：`EventHandler` 类型来自 `h3`；`server/utils/` 自动导入不变；高阶函数封装方式不变。

---

## 4. 路由保护的三种方式对比

| 方式 | 写法 | 特点 |
| --- | --- | --- |
| `server/middleware/` + `event.path` 判断 | 全局中间件里筛路由 | 集中，但所有请求都会进入中间件判断 |
| 抽象成普通函数 `protectedRoute(event)` | 在路由内手动 `await` | 极简、显式、按需调用 |
| `server/utils/` 高阶函数 `defineAuthResponseHandler` | 包装 handler，前后加逻辑 | 最灵活，自动导入，可在响应前后处理（类装饰器） |

---

## 5. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7） |
| --- | --- | --- |
| `server/middleware/` 位置 | 项目根 | 项目根（不进 `app/`） |
| 中间件每请求执行、不返回值 | 是 | 不变 |
| 执行顺序 | 字母序、数字前缀 | 不变（数字前缀注意补零 `01.`） |
| `createError({ statusCode, message })` | 支持 | 支持（文档新示例倾向 `status`/`statusText`，互为别名） |
| `getRequestURL` / `event.path` | 支持 | 不变 |
| 抽象函数的 `H3Event` 类型 | `import { H3Event } from 'h3'` | 不变 |
| 引用 server 内部文件 | `~/server/...` | **`~~/server/...`** 或 **`#server`** |
| `server/utils/` 自动导入 | 支持 | 不变 |
| `EventHandler` 类型 | from `h3` | 不变 |

> 结论：服务端中间件这两节的 **所有 API / 设计思路在 Nuxt 4 都保留**；差异集中在“`server/` 在项目根”和“引用 server 内部文件改用 `~~/server` 或 `#server`”这两点结构性变化上。

---

## 6. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。前置：完成 server 基础篇（已有 `server/api/test.ts`、`server/api/users/[id].ts`）。

1. 新建 `server/middleware/log.ts`，打印 `getRequestURL(event)`（2.1），访问任意 `/api/...` 看终端日志。
2. 新建 `server/middleware/auth.ts`，用假数据 + `createError({ statusCode: 401 })`（2.2）；把 `isLogin` 在 `true`/`false` 间切换观察 200 / 401。
3. 观察两个中间件执行顺序（auth 先于 log）；改名 `01.auth.ts` / `02.log.ts` 验证顺序控制（2.3）。
4. 在 `auth.ts` 用 `event.path.startsWith('/api/users')` 只保护 users 路由（2.4 方式一）。
5. 新建 `server/protectedRoute.ts`，在 `server/api/users/[id].ts` 用 `~~/server/protectedRoute` 或 `#server/protectedRoute` 导入并 `await`（2.4 方式二）；注意别用 `~/server`。
6. 新建 `server/utils/authHandler.ts` 写 `defineAuthResponseHandler` 高阶函数（3.2），把 `users/[id].ts` 的 `defineEventHandler` 换成它（自动导入，无需 import）。

```bash
npm run dev
```

> 💡 新建 `server/middleware/`、`server/utils/` 后需重启 dev server。

---

## 7. 易错点 + 关键 API 速查

### 易错点

- **别混淆两种 middleware**：`app/middleware/`（路由守卫）vs `server/middleware/`（每个 server 请求）。
- **server 中间件不要返回值**：只做检查/扩展 context/抛错，不要 return 数据或响应请求。
- **数字前缀补零**：`01.auth.ts`、`02.log.ts`（按字符串排序，`10.` 会排在 `2.` 前）。
- **`createError` 要 `throw`**：`throw createError({...})`，光调用不抛不生效；不抛错默认 200，未捕获错误 500。
- **引用 server 内部文件别名**：`~~/server` 或 `#server`，**别用 `~/server`**（Nuxt 4 的 `~` 指 `app/`）。
- **server utils 在 `server/utils/`**（项目根），前端 utils 在 `app/utils/`，别放错。
- **新建 `server/middleware`、`server/utils` 后重启 dev server**。

### 关键 API / 概念速查

| 名称 | 作用 | 备注 |
| --- | --- | --- |
| `server/middleware/`（项目根） | 服务端中间件 | 每请求、路由前执行，不返回值 |
| `getRequestURL(event)` | 取请求 URL | H3 内置 |
| `createError({ statusCode, message })` | 抛自定义错误 | 需 `throw`；文档新示例用 `status`/`statusText` |
| `event.path` | 当前请求路径 | 用于按路由甄别 |
| `H3Event` / `EventHandler` | H3 类型 | `import type { ... } from 'h3'` |
| `server/utils/`（项目根） | 服务端帮助函数 | 自动导入 |
| 高阶函数包 `defineEventHandler` | 请求前后加逻辑 | 类装饰器，最灵活 |
| `#server` / `~~/server` | server 内部别名 | Nuxt 4 |

---

> 小结：①`server/middleware/` 每请求执行、不返回值、字母序（数字前缀补零控制）、`createError` 抛错；②Nitro 无内置“路由级中间件”，三种保护方式：`event.path` 判断 / 抽象普通函数 / `server/utils/` 高阶函数封装（最灵活，类装饰器）；③Nuxt 4 里 `server/` 在项目根、`server/utils/` 自动导入不变，引用 server 内部文件改用 `~~/server` 或 `#server`，API 本身全不变。
