# 第 20-24 节：Nitro 插件（Server Plugins）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 24 节
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节。

---

## 1. 概述

上一节遗留了一个问题：**在 `nuxt.config.ts` 里无法使用 `useRuntimeConfig`**，所以 Redis 的 host/port 无法用 runtimeConfig 安全注入。这一节用 **Nitro 插件（服务端插件）** 解决，同时引出“服务端插件”这个新概念。

核心点：
- **`server/plugins/`** 目录下的文件**自动注册**，在**后端初始化时运行**。
- 用全局函数 **`defineNitroPlugin`** 定义，回调参数 `nitroApp` 是整个后端实例。
- 可通过 `nitroApp.hooks.hook(...)` 挂载后端**生命周期钩子**（请求前后等）。
- 用插件 + `useStorage().mount()` **手动挂载 Redis**——此时插件内可以用 `useRuntimeConfig`，于是问题迎刃而解。

> ⚠️ Nuxt 4 差异（先记住）
> `server/plugins/` 在 Nuxt 4 仍在**项目根的 `server/` 下**（不进 `app/`）。注意与下一节的 **Nuxt 应用插件 `app/plugins/`** 区分。`defineNitroPlugin` 用法不变。

---

## 2. 核心知识点 + 演示复盘

### 2.1 第一个 Nitro 插件

在 `server/plugins/` 下建文件即自动注册，后端启动时运行：

```ts
// server/plugins/test.ts
export default defineNitroPlugin((nitroApp) => {
  // nitroApp 是 NitroApp 类型——整个后端实例
  console.log(nitroApp)
})
```

修改后需**重启**应用，终端会打印 `nitroApp` 实例（含大量属性/方法）。

> ⚠️ Nuxt 4 差异：`server/plugins/`（项目根）与 `defineNitroPlugin` 用法不变。

### 2.2 挂载生命周期钩子

`nitroApp.hooks.hook(lifecycle, handler)` 可订阅贯穿请求始终的生命周期（`request`、`beforeResponse`、`afterResponse` 等）：

```ts
// server/plugins/test.ts
export default defineNitroPlugin((nitroApp) => {
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
```

发任意请求（如 `/api/test`），终端能看到 `on request`（含 path）和 `on response`（含 path 与 body）。

> 💡 用途：如果要在应用启动时初始化第三方库/工具，或在请求生命周期统一插入逻辑（日志、监控、统一处理），用 Nitro 插件很合适。
> ⚠️ Nuxt 4 差异：`nitroApp.hooks.hook` 生命周期用法不变。

### 2.3 用插件 + runtimeConfig 手动挂载 Redis（解决遗留问题）

关键来了：**Nitro 插件内可以使用组合式函数**（如 `useRuntimeConfig`、`useStorage`），所以把 Redis 的挂载放到插件里，配置就能走 runtimeConfig + `.env` 了。

第一步，`nuxt.config.ts` 用 runtimeConfig 声明 Redis 默认值（注释掉上一篇的 `nitro.storage` 写法）：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    redis: {
      host: '', // 默认空，由 .env 覆盖
      port: 0,
    },
  },
})
```

第二步，`.env` 用命名约定覆盖（嵌套用下划线）：

```bash
# .env
NUXT_REDIS_HOST=127.0.0.1
NUXT_REDIS_PORT=6379
```

第三步，写插件手动挂载 Redis driver：

```ts
// server/plugins/storage.ts
import redisDriver from 'unstorage/drivers/redis'

export default defineNitroPlugin(() => {
  // 插件内可用组合式函数：拿到 runtimeConfig（已被 .env 覆盖）
  const config = useRuntimeConfig()
  const storage = useStorage()

  // 手动创建 redis 驱动
  const driver = redisDriver({
    // base: 'redis', // 可选：存取时自动加前缀，便于区分
    host: config.redis.host,
    port: config.redis.port,
  })

  // 挂载到名为 'redis' 的挂载点（与之前使用处保持一致）
  storage.mount('redis', driver)
})
```

由于挂载点名仍是 `'redis'`，之前 `useStorage('redis')` 的使用处无需改动。登录写入、20 秒过期等功能照常工作。

> 💡 这正是 Nitro 官方推荐的“用服务端插件 + runtimeConfig 动态挂载存储”的做法——比把凭据明文写在 `nitro.storage` 里更安全。
> ⚠️ Nuxt 4 差异：`useStorage().mount()`、`redisDriver`（`unstorage/drivers/redis`）、`useRuntimeConfig()` 在插件中的用法全部不变。

---

## 3. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7） |
| --- | --- | --- |
| 服务端插件目录 | `server/plugins/` | `server/plugins/`（项目根，不进 `app/`） |
| `defineNitroPlugin` | 支持 | 不变 |
| `nitroApp.hooks.hook(...)` | 生命周期 | 不变 |
| `useRuntimeConfig()` 在插件中 | 可用 | 不变 |
| `useStorage().mount(name, driver)` | 支持 | 不变 |
| `redisDriver`（unstorage 驱动） | 支持 | 不变 |
| 与应用插件区分 | `plugins/`（根） | **应用插件在 `app/plugins/`**（见下一篇） |

> 结论：Nitro 插件这节在 Nuxt 4 **完全一致**，无目录或 API 变化；唯一要记牢的是“服务端插件 `server/plugins/` vs 应用插件 `app/plugins/`”的位置区别。

---

## 4. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。前置：完成存储层、配置篇；本地 Redis 已启动。

1. 新建 `server/plugins/test.ts`，`defineNitroPlugin` 打印 `nitroApp`，重启看终端（2.1）。
2. 加 `nitroApp.hooks.hook('request' / 'beforeResponse')` 打印请求/响应信息（2.2），访问 `/api/test` 观察。
3. 在 `nuxt.config.ts` 用 `runtimeConfig.redis = { host: '', port: 0 }`，`.env` 写 `NUXT_REDIS_HOST` / `NUXT_REDIS_PORT`（2.3）。
4. 新建 `server/plugins/storage.ts`，用 `redisDriver` + `useStorage().mount('redis', driver)` 手动挂载（2.3）。
5. 复用之前 `useStorage('redis')` 的登录/鉴权逻辑，验证功能正常。

```bash
npm run dev
```

> 💡 `unstorage/drivers/redis` 依赖 `ioredis`，若报缺依赖执行 `npm install ioredis`。新建 `server/plugins/` 后需重启。

---

## 5. 易错点 + 关键 API 速查

### 易错点

- **`server/plugins/` ≠ `app/plugins/`**：前者是 Nitro 服务端插件，后者是 Nuxt 应用插件（下一篇）。
- **插件内才能用组合式函数**：`useRuntimeConfig`/`useStorage` 在 `nuxt.config.ts` 里不能用，但在 Nitro 插件里可以。
- **挂载点名要一致**：`storage.mount('redis', ...)` 与使用处 `useStorage('redis')` 对应。
- **`.env` 嵌套命名**：`runtimeConfig.redis.host` → `NUXT_REDIS_HOST`。
- **新建 `server/plugins/` 后重启**。
- **Redis driver 依赖 `ioredis`**：缺则安装。

### 关键 API / 概念速查

| 名称 | 作用 | 备注 |
| --- | --- | --- |
| `server/plugins/`（项目根） | Nitro 服务端插件 | 自动注册，启动时运行 |
| `defineNitroPlugin(fn)` | 定义服务端插件 | 参数 `nitroApp`（后端实例） |
| `nitroApp.hooks.hook(name, fn)` | 订阅生命周期 | `request`/`beforeResponse`/`afterResponse` 等 |
| `useStorage().mount(name, driver)` | 手动挂载存储 | 配合 runtimeConfig 动态注入凭据 |
| `redisDriver`（`unstorage/drivers/redis`） | Redis 驱动 | 依赖 `ioredis` |
| `useRuntimeConfig()` | 取配置 | 插件内可用 |

---

> 小结：①`server/plugins/` 下的文件是 Nitro 服务端插件，`defineNitroPlugin` 定义，启动时运行；②`nitroApp.hooks.hook` 可挂载请求生命周期钩子；③插件内能用组合式函数，于是用「插件 + runtimeConfig + `useStorage().mount`」安全挂载 Redis，解决了配置文件不能用 `useRuntimeConfig` 的遗留问题；④Nuxt 4 完全一致，注意区分 `server/plugins/`（服务端）与 `app/plugins/`（应用端）。
