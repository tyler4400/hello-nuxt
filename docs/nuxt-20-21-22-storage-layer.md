# 第 20-21 / 20-22 节：存储层（Storage Layer / unstorage）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 21 节 + 第 22 节（合并）
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节（本项目 `nitropack@2.13.4`）。

---

## 1. 概述

这两节介绍 Nitro 内置的 **Storage Layer（存储层）**——一套可扩展的 **KV（key-value）存储**系统：

- 默认用**内存**存数据。
- 底层是 unjs 生态的 **`unstorage`**（Universal Key Value Storage），提供 **20+ 种驱动（drivers）**，可无缝切换内存 / Redis / 文件系统 / 各类数据库。
- 用统一 API 操作不同存储，换存储只需换驱动配置。

两节主线：
- **第 21 节**：`useStorage()` 基础用法（`setItem` / `getItem`），结合“登录 → 持久化 user → 鉴权读取”的实际场景。
- **第 22 节**：给存储层挂载 **Redis 驱动**（`nitro.storage` 配置），并用 `ttl` 实现自动过期。

> ⚠️ Nuxt 4 差异（先记住）
> `useStorage` 是**服务端（Nitro）**能力，相关代码都在项目根的 `server/` 下（不进 `app/`）。`useStorage`、`nitro.storage` 配置在 Nuxt 4 **用法不变**。

---

## 2. 核心知识点 + 演示复盘（第 21 节：useStorage 基础）

### 2.1 场景：登录接口写入存储

新建登录接口 `server/api/users/login.post.ts`，把用户名持久化到存储层：

```ts
// server/api/users/login.post.ts  →  POST /api/users/login
export default defineEventHandler(async (event) => {
  // 取出请求体里的 name
  const body = await readBody<{ name: string }>(event)
  const currentUser = { userName: body.name }

  // useStorage() 返回 unstorage 实例（全局函数，server 端自动可用）
  // setItem(key, value)：最常用的写入方法
  await useStorage().setItem('currentUser', currentUser)

  return currentUser
})
```

要点：
- **`useStorage()`** 返回 unstorage 实例（即存储层入口）。
- **`setItem(key, value)`**：KV 写入；这里把 `currentUser` 存到 `'currentUser'` 这个 key。

### 2.2 鉴权时读取存储

改造之前的鉴权逻辑（`server/utils/authHandler.ts` 或中间件），从存储层取数据判断是否登录：

```ts
// 鉴权片段：用 getItem 读取
export default defineEventHandler(async (event) => {
  // getItem(key)：读取；可传泛型标注类型
  const user = await useStorage().getItem<{ userName: string }>('currentUser')

  if (!user) {
    throw createError({ statusCode: 401, message: 'unauthorized' })
  }
  // 已登录，继续后续逻辑
})
```

- **`getItem(key)`**：KV 读取，无值返回 `null`。
- 流程验证：未登录访问 `/api/users/1` → 401；点登录写入存储 → 再访问 → 通过。

> 💡 `useStorage()` 实例还有很多 API（`hasItem`、`removeItem`、`getKeys`、`clear` 等），命名见名知意。
> ⚠️ Nuxt 4 差异：`useStorage` / `setItem` / `getItem` 用法不变。

---

## 3. 核心知识点 + 演示复盘（第 22 节：挂载 Redis 驱动）

### 3.1 配置 Redis 驱动

unstorage 的巧妙之处：**统一 API、只换驱动配置**。给存储层加 Redis，在 `nuxt.config.ts` 的 `nitro.storage` 下配置（底层用 `ioredis`，driver 内置于 unstorage，无需额外装库）：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  nitro: {
    storage: {
      // 'redis' 是这个挂载点的名称，自定义
      redis: {
        driver: 'redis',
        port: 6379,
        host: '127.0.0.1', // localhost
        password: '',       // 本地无密码
        db: 0,              // 默认 0，可省略
      },
    },
  },
})
```

> 前提：本地 Redis 已启动（可用 `redis-cli` 确认 6379 端口）。

### 3.2 使用指定的存储实例 + ttl 过期

`useStorage('redis')` 传入挂载点名称，即把数据存进 Redis。`setItem` 第三参 `options` 可设 `ttl`（自动过期，单位秒）：

```ts
// server/api/users/login.post.ts
export default defineEventHandler(async (event) => {
  const body = await readBody<{ name: string }>(event)
  const currentUser = { userName: body.name }

  // useStorage('redis') 指定使用 redis 挂载点
  // 第三参 options：ttl 20 秒后自动过期
  await useStorage('redis').setItem('currentUser', currentUser, { ttl: 20 })

  return currentUser
})
```

读取端也指定 `'redis'`，并可换更明确的 API（如 `hasItem` 只判断是否存在）：

```ts
// 鉴权片段
const isLogin = await useStorage('redis').hasItem('currentUser')
if (!isLogin) {
  throw createError({ statusCode: 401, message: 'unauthorized' })
}
```

验证：登录后 20 秒内访问受保护路由可通过；20 秒后 Redis 中 key 过期，再访问返回 401。用 `redis-cli` 的 `get currentUser` 也能看到值与过期。

> 💡 unjs 生态：Nitro、unstorage、ofetch（即 `$fetch`）等都来自 **unjs**——一系列高质量、单一职责的 JS 模块。unstorage 用统一 KV 接口适配众多驱动，源码很值得学习。
> ⚠️ Nuxt 4 差异：`useStorage('redis')`、`ttl`、`nitro.storage` 配置在 Nuxt 4 全部不变。

---

## 4. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7） |
| --- | --- | --- |
| `useStorage()` | server 端全局函数 | 不变 |
| `setItem` / `getItem` / `hasItem` | KV 读写 | 不变 |
| `nitro.storage.<name>` 配置 | nuxt.config | 不变 |
| Redis driver（`driver: 'redis'`） | 内置 unstorage | 不变 |
| `ttl` 过期选项 | 支持 | 不变 |
| 相关代码位置 | `server/` | `server/`（项目根，不进 `app/`） |

> 结论：存储层这两节是纯**服务端（Nitro）**能力，**Nuxt 4 完全一致**，没有目录或 API 变化。

---

## 5. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。前置：已有 `server/` 目录（见 server 基础篇）。

### 内存版（无需额外依赖）

1. 新建 `server/api/users/login.post.ts`，用 `useStorage().setItem('currentUser', ...)` 写入（2.1）。
2. 在鉴权处用 `useStorage().getItem('currentUser')` 读取判断（2.2）。
3. 前端按钮 `$fetch('/api/users/login', { method: 'post', body: { name: 'viking' } })` 触发登录，再访问受保护接口验证。

```bash
npm run dev
```

### Redis 版（需本地 Redis）

4. 启动本地 Redis（确认 `redis-cli` 能连 6379）。
5. 在 `nuxt.config.ts` 加 `nitro.storage.redis` 配置（3.1）。
6. 把 `useStorage()` 改为 `useStorage('redis')`，加 `{ ttl: 20 }`（3.2）。
7. 登录后 20 秒内访问通过、20 秒后 401；用 `redis-cli` 的 `get currentUser` 观察。

> 💡 unstorage 的 redis driver 依赖 `ioredis`；若运行时报缺少依赖，按提示 `npm install ioredis` 即可。下一篇（Nitro plugins）会用「服务端插件 + runtimeConfig」更安全地挂载 Redis。

---

## 6. 易错点 + 关键 API 速查

### 易错点

- **`useStorage` 是 server 端能力**：在 `server/` 下的路由/中间件/插件里用，不是前端组件。
- **key 不要拼错**：`setItem` / `getItem` 用同一个 key 才能取到。
- **`getItem` 无值返回 `null`**：判空用真值判断。
- **Redis driver 需本地 Redis 运行**：否则连接失败。
- **`ttl` 单位是秒**：`{ ttl: 20 }` 是 20 秒。
- **挂载点名称要一致**：配置里叫 `redis`，使用时 `useStorage('redis')` 要对应。

### 关键 API / 概念速查

| 名称 | 作用 | 备注 |
| --- | --- | --- |
| `useStorage(base?)` | 取存储实例 | 不传=默认（内存）；传名称=指定挂载点 |
| `.setItem(key, value, options?)` | 写入 | `options.ttl` 过期（秒） |
| `.getItem<T>(key)` | 读取 | 无值返回 `null` |
| `.hasItem(key)` | 是否存在 | 返回布尔 |
| `nitro.storage.<name>` | 配置驱动 | nuxt.config |
| `driver: 'redis'` | Redis 驱动 | 底层 ioredis，unstorage 内置 |
| unstorage | 统一 KV 存储 | unjs 生态，20+ 驱动 |

---

> 小结：①Nitro 内置存储层（unstorage），`useStorage()` + `setItem`/`getItem` 做 KV 读写，默认内存；②配 `nitro.storage.redis` 即可换 Redis，`useStorage('redis')` + `ttl` 实现过期；③纯服务端能力，Nuxt 4 完全一致。
