# 第 20-23 节：配置文件与环境变量（runtimeConfig / app.config / .env）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 23 节
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节。

---

## 1. 概述

上一节把 Redis 的 `host`/`password` 等敏感信息直接写进了 `nuxt.config.ts` 明文里。这一节解决“敏感配置如何安全管理”，引出两套配置体系：

| 配置 | 用途 | 环境变量 | 何时确定 | 客户端可读 |
| --- | --- | --- | --- | --- |
| **`runtimeConfig`** | 私密/运行时配置（token、密钥） | ✅ 支持覆盖 | 运行时 | 仅 `public` 下可读 |
| **`app.config`** | 公开的应用配置（主题、标题） | ❌ 不支持 | 构建时 | ✅ 可读，且支持 HMR |

主线：`runtimeConfig` → `runtimeConfig.public` → `.env` 命名覆盖 → `app.config.ts`。

> ⚠️ Nuxt 4 差异（先记住）
> - `nuxt.config.ts`、`runtimeConfig`、`useRuntimeConfig`、`.env` 命名约定：**不变**。
> - **`app.config.ts` 在 Nuxt 4 移到 `app/app.config.ts`**（在 srcDir 根，即 `app/` 下）；课程在项目根。
> - server 端读 runtimeConfig 时，Nuxt 4 **推荐 `useRuntimeConfig(event)` 传入 `event`**，以正确拿到环境变量在运行时的覆盖值。

---

## 2. 核心知识点 + 演示复盘

### 2.1 `runtimeConfig`：运行时（私密）配置

在 `nuxt.config.ts` 加 `runtimeConfig`，里面的值“在运行时才被感知”，适合私密信息：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    // 默认值，运行时可被环境变量覆盖
    apiKey: '1234',
  },
})
```

用 **`useRuntimeConfig()`** 获取。先看**后端**（能拿到顶层私密值）：

```ts
// server/api/test.ts
export default defineEventHandler((event) => {
  // Nuxt 4 推荐在 server 端传入 event，确保拿到环境变量覆盖后的值
  const config = useRuntimeConfig(event)
  console.log(config.apiKey) // 后端能打印出 1234
  return { ok: true }
})
```

再看**前端**：

```vue
<!-- app/app.vue -->
<script setup lang="ts">
const config = useRuntimeConfig()
console.log(config.apiKey) // ❗前端是 undefined：顶层 runtimeConfig 只在后端可读
</script>
```

> 结论：`runtimeConfig` **顶层的值只有后端能读**，最终生成的前端代码不会泄露这些秘密。

### 2.2 `runtimeConfig.public`：前后端都可读

有些非私密信息（如 API base url、语言选项）希望前端也能拿到，放进 **`public`**：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  runtimeConfig: {
    apiKey: '1234', // 仅后端
    public: {
      apiBase: 'https://api.example.com', // 前后端都可读
    },
  },
})
```

```vue
<script setup lang="ts">
const config = useRuntimeConfig()
// public 下的值前端能拿到（public 是保留字，用 config.public.apiBase 访问）
console.log(config.public.apiBase)
</script>
```

### 2.3 `.env` 环境变量自动覆盖（命名约定）

Nuxt 用**特殊命名约定**让 `.env` 自动覆盖 `runtimeConfig`，无需手写 `process.env`：

规则：`NUXT_` 前缀 + 按驼峰拆分用下划线连接 + 全大写。

```bash
# .env
# 覆盖 runtimeConfig.apiKey
NUXT_API_KEY=3456

# 覆盖嵌套的 runtimeConfig.public.apiBase（public 也算一层）
NUXT_PUBLIC_API_BASE=https://prod.example.com
```

| runtimeConfig 路径 | 对应环境变量 |
| --- | --- |
| `apiKey` | `NUXT_API_KEY` |
| `public.apiBase` | `NUXT_PUBLIC_API_BASE` |
| `redis.host` | `NUXT_REDIS_HOST` |

设置后，后端读到的 `apiKey` 就变成了 `.env` 里的 `3456`——运行时自动覆盖，完美解决敏感信息明文问题。

> ⚠️ Nuxt 4 差异：`.env` 的 `NUXT_` 命名覆盖约定不变。
> 💡 `runtimeConfig` 的值会被序列化传给 Nitro，所以**不能放函数、Set、Map 等不可序列化的数据**。

### 2.4 `app.config.ts`：构建时（公开）配置

有些配置在编译前就能确定、且不敏感（主题色、标题等），用 **`app.config.ts`** + `defineAppConfig`：

```ts
// 课程：app.config.ts（项目根）
// 我的项目：app/app.config.ts（Nuxt 4 在 app/ 下）
export default defineAppConfig({
  // 主题色等公开配置
  primaryColor: 'blue',
})
```

用 **`useAppConfig()`** 获取（前端可读、支持 HMR）：

```vue
<!-- app/app.vue -->
<script setup lang="ts">
const appConfig = useAppConfig()
console.log(appConfig.primaryColor) // 'blue'
</script>

<template>
  <div>{{ appConfig.primaryColor }}</div>
</template>
```

> ⚠️ Nuxt 4 差异（重点）：`app.config.ts` 在 Nuxt 4 必须放 **`app/app.config.ts`**（srcDir 根）。`defineAppConfig` / `useAppConfig` 用法不变。
> 💡 第一次新建该文件需重启；之后修改支持 HMR、开发环境无需刷新即生效。

### 2.5 两者适用场景对比

| | `runtimeConfig` | `app.config` |
| --- | --- | --- |
| 支持环境变量 | ✅ | ❌ |
| 适合 | 运行时才提供的**敏感/私密**数据 | 应用整体的**不敏感**配置 |
| HMR | — | ✅ |
| 客户端可读 | 仅 `public` | ✅ 全部 |

> 遗留问题：本节想在 `nuxt.config.ts` 里用 `useRuntimeConfig`（比如给 Redis 配置取值），但**配置文件里无法使用组合式函数**。下一节用 **Nitro 插件** 解决这个问题（见 `nuxt-20-24-nitro-plugins`）。

---

## 3. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7） |
| --- | --- | --- |
| `nuxt.config.ts` | 项目根 | 项目根（不变） |
| `runtimeConfig` / `useRuntimeConfig` | 支持 | 不变 |
| `runtimeConfig.public` | 前后端可读 | 不变 |
| `.env` 的 `NUXT_` 覆盖约定 | 支持 | 不变 |
| server 端取 config | `useRuntimeConfig()` | 推荐 **`useRuntimeConfig(event)`** 传 event |
| `app.config.ts` 位置 | 项目根 | **`app/app.config.ts`** |
| `defineAppConfig` / `useAppConfig` | 支持 | 不变 |

> 结论：配置体系的 API 在 Nuxt 4 基本不变；唯一目录差异是 **`app.config.ts` → `app/app.config.ts`**，外加 server 端推荐给 `useRuntimeConfig` 传 `event`。

---

## 4. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。

1. 在 `nuxt.config.ts` 加 `runtimeConfig: { apiKey: '1234', public: { apiBase: '...' } }`（2.1 / 2.2）。
2. 在 `server/api/test.ts` 用 `useRuntimeConfig(event)` 打印 `apiKey`，访问 `/api/test` 看后端日志。
3. 在 `app/app.vue` 用 `useRuntimeConfig()`，确认 `apiKey` 为 `undefined`、`public.apiBase` 可读。
4. 新建 `.env`，写 `NUXT_API_KEY=3456`、`NUXT_PUBLIC_API_BASE=...`，重启后确认覆盖生效（2.3）。
5. 新建 **`app/app.config.ts`**（注意在 `app/` 下），写 `defineAppConfig({ primaryColor: 'blue' })`，重启（2.4）。
6. 在 `app/app.vue` 用 `useAppConfig()` 渲染 `primaryColor`，确认 HMR 生效。

```bash
npm run dev
```

> 💡 `.env` 不要提交到 git；`runtimeConfig` 里写默认值（空字符串/0），真实值放 `.env`。

---

## 5. 易错点 + 关键 API 速查

### 易错点

- **`runtimeConfig` 顶层只后端可读**：前端需要的放 `public`。
- **`.env` 命名要严格**：`NUXT_` + 驼峰拆分下划线 + 全大写，如 `NUXT_PUBLIC_API_BASE`。
- **`app.config.ts` 放 `app/` 下**（Nuxt 4），不是项目根。
- **配置文件里不能用组合式函数**：`nuxt.config.ts` 里不能 `useRuntimeConfig()`（下一节用 Nitro 插件解决）。
- **`runtimeConfig` 不能存不可序列化数据**：函数/Set/Map 等放插件里。
- **server 端给 `useRuntimeConfig` 传 `event`**（Nuxt 4 推荐）以拿到运行时覆盖值。
- **新建 `app.config.ts` 需重启**，之后支持 HMR。

### 关键 API / 概念速查

| 名称 | 作用 | 备注 |
| --- | --- | --- |
| `runtimeConfig` | 运行时配置 | 顶层仅后端；`public` 前后端 |
| `useRuntimeConfig(event?)` | 读 runtimeConfig | server 端推荐传 `event` |
| `runtimeConfig.public` | 公开运行时配置 | 前后端可读 |
| `.env` + `NUXT_` 前缀 | 覆盖 runtimeConfig | 命名约定自动映射 |
| `app.config.ts`（→ `app/`） | 构建时公开配置 | 支持 HMR |
| `defineAppConfig` / `useAppConfig` | 定义/读取 app config | 全局可用 |

---

> 小结：①`runtimeConfig` 管私密/运行时配置（顶层仅后端、`public` 前后端、`.env` 用 `NUXT_` 前缀自动覆盖）；②`app.config.ts` 管构建时公开配置（支持 HMR）；③Nuxt 4 里 `app.config.ts` 移到 `app/`、server 端 `useRuntimeConfig(event)` 传 event，其余不变；④配置文件内无法用组合式函数，下节用 Nitro 插件解决。
