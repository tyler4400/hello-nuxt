# 第 20-15 节：SEO 与 Head 管理（nuxt.config / useHead / useSeoMeta）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 15 节
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节。

---

## 1. 概述

这一节从上一节的“样式”话题自然延伸：先解决“**如何全局引入 CSS**”，由此引出核心配置文件 **`nuxt.config.ts`** 和 **`app.head`**；再顺势进入本节重点——**SEO 与 Meta 标签管理**。

主线（一条线索串起来）：
1. `nuxt.config.ts` 的 `css` 数组 → 全局 CSS。
2. `app.head` → 全局 head 标签（第三方 CSS `link`、`charset`、`title`、`meta`）。
3. 页面级 SEO 的三种方式：**`useHead`**、**`useSeoMeta`**、**SEO 全局组件**（`<Head>` / `<Title>` / `<Meta>` / `<Style>`）。

> ⚠️ Nuxt 4 底层差异（先记住）
> Nuxt 4 的 head 管理底层升级为 **Unhead v2**。`useHead` / `useSeoMeta` / SEO 组件等**基础用法完全不变**，但有几个迁移注意点（见第 5 节）：`useServerHead` / `useServerSeoMeta` 被移除、`vmid`/`hid` 等遗留属性被移除、`meta` 的 `content` 趋于必填（讲师写法本就带 `content`，不受影响）。

---

## 2. 核心知识点 + 演示复盘

### 2.1 `nuxt.config.ts`：全局 CSS

`nuxt.config.ts` 是和整个 Nuxt 应用相关的核心配置文件（后面会反复遇到）。要全局引入一个 CSS 文件，用它的 `css` 数组属性：

```ts
// nuxt.config.ts（项目根目录，Nuxt 3 / 4 都在根目录）
export default defineNuxtConfig({
  // css 是数组，可加多个全局样式文件
  css: ['~/assets/style.css'],
})
```

加上后，这个样式就全局生效（不必再在组件里逐个引入）。

> ⚠️ 注意：**修改 `nuxt.config.ts` 会触发 Nuxt 应用自动重启**一次，重启完样式才生效。
> ⚠️ Nuxt 4 差异：`css` 数组用法不变；`~/assets/style.css` 中的 `~` 在 Nuxt 4 指 `app/`，因此解析到 `app/assets/style.css`（与上一节一致）。

### 2.2 `app.head`：全局 head 标签

`app` 是对整个应用程序的配置，其下的 `head` 对应 HTML 的 `<head>` 标签内容。可在这里全局设置第三方 CSS、字符编码、标题、meta 等。

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  app: {
    head: {
      // 整页编码
      charset: 'utf-8',
      // 全局标题
      title: 'My Test App',
      // meta 标签数组，可多个
      meta: [
        { name: 'description', content: 'My Test App desc' },
      ],
      // link 标签数组：可加第三方 CSS 等
      link: [
        { rel: 'stylesheet', href: 'https://cdn.example.com/some.css' },
      ],
    },
  },
})
```

设置后，查看页面 `<head>`，会看到 `title`、`description`、`charset`、第三方 `link` 都已注入。这正是 Nuxt 作为前后端一体（SSR）框架对 SEO 友好的体现——这些标签在服务端就渲染进了 HTML。

> ⚠️ Nuxt 4 差异：`app.head`（`charset` / `title` / `meta` / `link`）配置方式**不变**。

### 2.3 页面级 SEO 方式一：`useHead`

`app.head` 是“全局”设置。但每个页面（`pages/` 下）的 SEO 信息通常不同，需要**逐页设置**。Nuxt 提供全局组合式函数 **`useHead`**（自动导入），写法和 `app.head` 几乎一致：

```vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
useHead({
  title: 'User Detail Page',
  meta: [
    { name: 'description', content: 'User Detail Page desc' },
  ],
})
</script>
```

进入该页面时，`<title>` 会被改写为 `User Detail Page`，覆盖全局设置。

> ⚠️ Nuxt 4 差异：`useHead` 用法不变（底层 Unhead v2）。

### 2.4 页面级 SEO 方式二：`useSeoMeta`（推荐，专注 SEO）

**`useSeoMeta`** 是专门面向 SEO meta 的快捷方式：**扁平写法**（不用写 `meta` 数组）、**全自动补全**、可杜绝拼写错误。

```vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
useSeoMeta({
  title: 'User Detail Page',
  // 直接写 description，不必再包一层 meta: [{ name, content }]
  description: 'User Detail Page desc',
})
</script>
```

#### 支持响应式（比配置文件强大的地方）

配置文件里只能写死字符串；而 `useSeoMeta` **支持响应式数据**——把值写成 **getter 函数**（`() => ...`），数据变化时 meta 会自动更新：

```vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
import type { UserData } from '~/types/user'

const route = useRoute()
const { data } = await useFetch<UserData>(
  `https://jsonplaceholder.typicode.com/users/${route.params.id}`
)

useSeoMeta({
  // 用 getter 返回响应式 title；数据未到时可能是 undefined，到达后自动更新
  title: () => `User: ${data.value?.name}`,
})
</script>
```

> ⚠️ Nuxt 4 差异：`useSeoMeta` 用法不变；响应式 getter 写法不变。

### 2.5 页面级 SEO 方式三：SEO 全局组件

Nuxt 还提供一组**全局组件**，可直接在 `<template>` 中使用。注意**首字母大写**（区别于普通 HTML 标签，告诉 Vue 这是自定义组件）：

```vue
<!-- app/pages/users/[id].vue -->
<template>
  <div>
    <Head>
      <Title>User Detail Page</Title>
      <Meta name="description" content="User Detail Page desc" />
      <!-- 甚至可以内联样式 -->
      <Style>{{ 'body { background: green; }' }}</Style>
    </Head>

    <!-- 页面其余内容 -->
  </div>
</template>
```

三种方式（`useHead` / `useSeoMeta` / 全局组件）任选其一即可，按个人喜好。

> ⚠️ 演示提示：同时用多种方式时，记得把其他方式注释掉，避免互相覆盖影响观察。
> ⚠️ Nuxt 4 差异：`<Head>` / `<Title>` / `<Meta>` / `<Style>` 等组件由 Unhead 提供，Nuxt 4 仍可用、写法不变。

---

## 3. 三种页面级 SEO 方式对比

| 方式 | 写法 | 特点 | 适用 |
| --- | --- | --- | --- |
| `useHead` | `meta: [{ name, content }]` 数组 | 通用，能设 title/meta/link/script/style 等 | 需要设置 meta 之外的 head 标签 |
| `useSeoMeta` | 扁平 `description: '...'` | 专注 SEO、有补全、防拼写错；支持响应式 getter | **首选**，纯 SEO meta 场景 |
| 全局组件 `<Head>...` | 模板里写标签 | 直观、贴近 HTML | 喜欢模板式写法 |

---

## 4. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7） |
| --- | --- | --- |
| `nuxt.config.ts` 位置 | 项目根 | 项目根（不变） |
| `css: [...]` 全局样式 | 支持 | 不变（`~` 指 `app/`） |
| `app.head`（charset/title/meta/link） | 支持 | 不变 |
| 修改 config 自动重启 | 是 | 是 |
| `useHead` | 支持 | 不变（底层 Unhead v2） |
| `useSeoMeta` | 支持，含响应式 getter | 不变 |
| SEO 组件 `<Head>`/`<Title>`/`<Meta>`/`<Style>` | 支持 | 不变 |
| `useServerHead` / `useServerSeoMeta` | 存在 | **已移除**（用 `useHead`/`useSeoMeta` 代替） |
| `meta` 的 `content` | 可省略 | **趋于必填**（移除则显式传 `null`） |
| 遗留属性 `vmid`/`hid`/`children`/`body` | 兼容 | 已移除 |

> 结论：SEO 这节的**所有讲解 API 在 Nuxt 4 都保留、用法一致**；差异在底层 Unhead v2 的几个迁移点（server 版 composable 移除、meta content 必填、遗留属性移除）。讲师的写法本就符合新规范，照抄即可。

---

## 5. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。现状 `nuxt.config.ts`：
>
> ```ts
> export default defineNuxtConfig({
>   compatibilityDate: '2025-07-15',
>   devtools: { enabled: true },
>   modules: ['@nuxtjs/tailwindcss']
> })
> ```

1. 准备 `app/assets/style.css`（上一节已建；如没有，新建并写点样式）。
2. 在 `nuxt.config.ts` 增加全局 `css` 与 `app.head`：

```ts
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  // 全局 CSS
  css: ['~/assets/style.css'],
  app: {
    head: {
      charset: 'utf-8',
      title: 'My Test App',
      meta: [{ name: 'description', content: 'My Test App desc' }],
      link: [{ rel: 'stylesheet', href: 'https://cdn.example.com/some.css' }],
    },
  },
})
```

3. 改完保存，等待 **自动重启**；首页查看 `<head>`，确认 `title` / `description` / 全局 CSS 生效。
4. 在 `app/pages/users/[id].vue` 用 **`useHead`** 设置页面标题，进入页面确认 `<title>` 被覆盖。
5. 换成 **`useSeoMeta`** 扁平写法，再加一个响应式 `title`（getter 返回 `User: <名字>` 形式，见 2.4），进入 `/users/1`、`/users/2` 观察标题随数据更新（数据到达前可能短暂为 `undefined`）。
6. 换成 **SEO 全局组件**（`<Head><Title>...</Title></Head>`），确认效果一致；注意只保留一种方式，其余注释掉。

```bash
npm run dev
```

> 💡 第 4 步起 `/users/[id]` 可能被 `auth` 中间件拦截，可临时注释该页 `definePageMeta` 里的 `middleware`，或先登录。

---

## 6. 易错点 + 关键 API 速查

### 易错点

- **改 `nuxt.config.ts` 会自动重启**：等重启完再看效果，别误以为没生效。
- **响应式必须用 getter 函数**：`useSeoMeta({ title: () => ... })`，把值写成 `() => 模板字符串` 才会随数据更新；直接写死字符串不会。
- **全局组件首字母大写**：`<Head>` / `<Title>` / `<Meta>`，小写会被当成普通 HTML 标签。
- **多种方式别叠加**：同时用 `useHead`、`useSeoMeta`、组件会互相覆盖，演示时只留一种。
- **Nuxt 4 不要用 `useServerHead` / `useServerSeoMeta`**：已移除，用 `useHead` / `useSeoMeta`；只需服务端时用 `if (import.meta.server) { useHead(...) }`。
- **`meta` 记得带 `content`**：新版趋于必填，要“移除某个 meta”时显式传 `content: null`。
- **`~` 指 `app/`**：`css: ['~/assets/style.css']` 解析到 `app/assets/style.css`。

### 关键 API / 概念速查

| 名称 | 作用 | 备注 |
| --- | --- | --- |
| `nuxt.config.ts` | 应用核心配置 | 在项目根；改动自动重启 |
| `css: [...]` | 全局样式数组 | `~/assets/...` 指 `app/assets/` |
| `app.head` | 全局 head 标签 | `charset`/`title`/`meta`/`link` |
| `useHead(obj)` | 页面级 head | 通用，`meta` 为数组 |
| `useSeoMeta(obj)` | 页面级 SEO meta | 扁平写法、有补全、支持响应式 getter（首选） |
| `<Head>`/`<Title>`/`<Meta>`/`<Style>` | SEO 全局组件 | 模板内使用，首字母大写 |
| Unhead v2 | head 管理底层 | Nuxt 4 采用；server 版 composable 已移除 |

---

> 小结：①`nuxt.config.ts` 的 `css` 数组做全局样式、`app.head` 做全局 head；②页面级 SEO 三选一：`useHead`（通用）、`useSeoMeta`（首选，扁平+响应式）、`<Head>` 组件（模板式）；③Nuxt 4 这些 API 全部保留、用法不变，仅底层 Unhead v2 有少量迁移点，讲师写法已符合新规范。
