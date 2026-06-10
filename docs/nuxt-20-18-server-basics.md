# 第 20-18 节：Nuxt Server 基础知识（Nitro / H3）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 18 节
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节（本项目 `nitropack@2.13.4`）。

---

## 1. 概述

从这一节起进入 **Nuxt Server**（服务端）部分。Nuxt 的服务端能力由 **Nitro**（服务端引擎）+ **H3**（HTTP 框架）提供，写法和前端一样讲究“约定大于配置”。

本节按学习后端框架的通用顺序，依次掌握：**路由 → 参数 → query → method → body**。

> ⚠️ Nuxt 4 最重要的差异（先记住）
> 前端约定目录都进了 `app/`，但 **`server/` 目录在 Nuxt 4 仍在项目根**（与 `app/` 平行），**不进 `app/`**。
> 即：`server/api/`、`server/routes/`、`server/middleware/`、`server/utils/` 都在项目根的 `server/` 下。
> 原因：Nuxt 4 把 app 代码与 server 代码分成两个独立的运行上下文（也是两个独立的 TypeScript 工程），互不串扰、类型更准。

---

## 2. 核心知识点 + 演示复盘

### 2.1 文件式路由

和 `pages/` 一样，server 路由也基于文件系统：在 `server/api/` 下建文件即生成路由，无需任何配置。每个文件用全局函数 **`defineEventHandler`** 导出一个处理函数。

```ts
// server/api/test.ts  →  路由 /api/test
export default defineEventHandler((event) => {
  // event 是内置事件对象，含本次 HTTP 请求的各种信息（先不用）
  return { name: 'viking' }
})
```

访问 `/api/test` 即返回 `{ "name": "viking" }`。也支持返回 Promise（会等 resolve 后再返回）：

```ts
export default defineEventHandler((event) => {
  return Promise.resolve({ name: 'viking' })
})
```

> 📌 目录约定：`server/api/` 下的路由会自动加 `/api` 前缀；若想要**不带 `/api` 前缀**的路由，放到 `server/routes/` 下。
> ⚠️ Nuxt 4 差异：`server/api/test.ts` 仍在项目根的 `server/` 下；`defineEventHandler`（及别名 `eventHandler`）用法不变。

### 2.2 动态参数：`getRouterParam`

和 pages 一样用方括号定义动态参数。例如按用户 id 取数据：

```ts
// server/api/users/[id].ts  →  /api/users/:id
export default defineEventHandler((event) => {
  // 推荐用内置函数获取单个路由参数（更快捷、更安全）
  const id = getRouterParam(event, 'id')

  // 也可以从 event.context.params 上拿：
  // const id = event.context.params?.id

  return { id }
})
```

访问 `/api/users/1` 返回 `{ "id": "1" }`。

> 💡 命名提醒：讲师口述的“getRouterParameter”，**准确名是 `getRouterParam`（单数，取单个参数）**；另有 `getRouterParams`（复数，取所有参数对象）。
> ⚠️ Nuxt 4 差异：`getRouterParam` / `event.context.params` 用法不变。

### 2.3 获取 query：`getQuery`

```ts
// server/api/users/[id].ts
export default defineEventHandler((event) => {
  const id = getRouterParam(event, 'id')
  // 访问 /api/users/1?name=Hello&age=18
  const query = getQuery(event) // → { name: 'Hello', age: '18' }
  return { id, query }
})
```

> ⚠️ Nuxt 4 差异：`getQuery` 用法不变。

### 2.4 不同 method：用文件后缀

通过**文件名后缀**决定 HTTP 方法，非常直观：

| 文件 | 匹配的请求 |
| --- | --- |
| `server/api/test.ts` | 所有方法（默认，常用于 GET） |
| `server/api/test.get.ts` | GET `/api/test` |
| `server/api/test.post.ts` | POST `/api/test` |
| `server/api/test.patch.ts` / `.delete.ts` … | 对应方法 |

```ts
// server/api/test.post.ts  →  POST /api/test
export default defineEventHandler((event) => {
  return { data: 'post method' }
})
```

> ⚠️ Nuxt 4 差异：method 后缀机制不变。

### 2.5 获取 body：`readBody`

POST 等请求携带的 body，用内置全局函数 **`readBody`** 获取（注意它是异步的，需 `await`，handler 要写成 `async`）：

```ts
// server/api/test.post.ts
export default defineEventHandler(async (event) => {
  // 读取请求体
  const body = await readBody(event)
  return { body }
})
```

### 2.6 在前端发请求验证

在 `app/app.vue` 用 `$fetch` 向自己的 server 路由发 POST 请求（前端事件触发的请求，用 `$fetch` 最合适）：

```vue
<!-- app/app.vue -->
<script setup lang="ts">
const handleSend = async () => {
  // 向 /api/test 发 POST，携带 body
  const data = await $fetch('/api/test', {
    method: 'post',
    body: { name: 'viking' },
  })
  console.log(data)
}
</script>

<template>
  <button @click="handleSend">post method</button>
</template>
```

点击按钮，控制台能看到 server 返回的数据，且 server 端 `readBody` 能拿到 `{ name: 'viking' }`。

> ⚠️ Nuxt 4 差异：`$fetch`、`readBody` 用法不变（`$fetch` 详见数据获取篇 `nuxt-20-11-12-13`）。

---

## 3. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7） |
| --- | --- | --- |
| `server/` 目录位置 | 项目根 | 项目根（**不进 `app/`**，与 `app/` 平行） |
| `server/api/` 前缀 | 自动 `/api` | 不变 |
| `server/routes/` | 无 `/api` 前缀 | 不变 |
| `defineEventHandler` | 全局可用 | 不变 |
| 动态参数 `[id].ts` | `getRouterParam` / `event.context.params` | 不变 |
| `getQuery` / `readBody` | 全局可用 | 不变 |
| method 后缀（`.post.ts`） | 支持 | 不变 |
| TypeScript 上下文 | 单一 | **server 独立 TS 工程**（与 app 分离） |
| 前后端共享代码 | 一般放根目录 | 用新的 **`shared/`** 目录（Nuxt 3.14+/4） |
| 引用 server 内部文件别名 | `~/server/...` | **`~~/server/...`** 或新别名 **`#server`**（`~` 在 Nuxt 4 指 `app/`） |

> 结论：server 基础这节的 **API 全部不变**；唯一结构性差异是“`server/` 留在项目根、不进 `app/`”，以及 server 有独立 TS 上下文与 `#server` 别名（下一篇会用到）。

---

## 4. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。注意：本项目目前**没有 `server/` 目录，需在项目根手动新建**（不是在 `app/` 下）。

1. 新建 `server/api/test.ts`，返回 `{ name: 'viking' }`（2.1），重启后访问 `http://localhost:3000/api/test` 验证。
2. 新建 `server/api/users/[id].ts`，用 `getRouterParam(event, 'id')` 返回 id（2.2），访问 `/api/users/1`。
3. 在上面加 `getQuery(event)`，访问 `/api/users/1?name=Hello&age=18` 查看 query（2.3）。
4. 新建 `server/api/test.post.ts` 返回 `{ data: 'post method' }`（2.4）。
5. 在 `test.post.ts` 里用 `await readBody(event)` 读取 body（2.5）。
6. 在 `app/app.vue` 加按钮，用 `$fetch('/api/test', { method: 'post', body: { name: 'viking' } })` 发请求，控制台验证（2.6）。

```bash
npm run dev
```

> 💡 新建 `server/` 目录后需重启 dev server（与新建任何约定目录同理）。

---

## 5. 易错点 + 关键 API 速查

### 易错点

- **`server/` 不要放进 `app/`**：Nuxt 4 里它在项目根，与 `app/` 平行。
- **不能在 Vue app 里 import `server/` 的代码**：两者上下文隔离。前后端共享的纯逻辑放 `shared/`。
- **引用 server 内部文件别名**：用 `~~/server/...` 或 `#server`，**别用 `~/server/...`**（`~` 在 Nuxt 4 指 `app/`，会找不到）。
- **`getRouterParam` 是单数**：取单个参数；取全部用 `getRouterParams`。
- **`readBody` 要 `await`**：handler 需写成 `async`。
- **query 值是字符串**：`getQuery` 返回的 `age` 是 `'18'` 而非数字。
- **新建 `server/` 后重启 dev server**。

### 关键 API / 概念速查

| 名称 | 作用 | 备注 |
| --- | --- | --- |
| `server/api/`（项目根） | API 路由目录 | 自动加 `/api` 前缀 |
| `server/routes/` | 无前缀路由 | 项目根 |
| `defineEventHandler(fn)` | 定义路由处理 | 全局可用；别名 `eventHandler` |
| `getRouterParam(event, 'id')` | 取单个动态参数 | 复数版 `getRouterParams` |
| `getQuery(event)` | 取 query | 值为字符串 |
| `readBody(event)` | 取请求体 | 异步，需 `await` |
| `[id].ts` + 后缀 `.post.ts` | 动态参数 + 指定 method | 文件名约定 |
| `#server` / `~~/server` | server 内部别名 | Nuxt 4（`~` 指 `app/`） |
| `shared/` | 前后端共享代码 | Nuxt 3.14+/4 |

---

> 小结：①server 路由基于文件，`server/api/test.ts` → `/api/test`，用 `defineEventHandler`；②参数用 `getRouterParam`、query 用 `getQuery`、body 用 `readBody`、method 用文件后缀；③Nuxt 4 里 `server/` 留在项目根（不进 `app/`）、有独立 TS 上下文，引用其内部文件用 `~~/server` 或 `#server`，API 本身全不变。
