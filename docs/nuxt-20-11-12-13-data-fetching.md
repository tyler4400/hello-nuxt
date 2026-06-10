# 第 20-11 / 20-12 / 20-13 节：数据获取（Data Fetching）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 11 + 12 + 13 节（合并）
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节。
> ⚠️ **本篇是 Nuxt 3 → 4 差异最大的一章**：Nuxt 4 重写了 data fetching 层，`data`/`error` 默认值、响应式、`pending` 等都有变化，已就近标注。

---

## 1. 概述

数据获取（Data Fetching）是实战重点。Nuxt 能在服务端与客户端之间无缝获取数据，并提供一组组合式函数，自带响应状态、错误处理等能力。

三节主线：
- **第 11 节**：核心函数 **`useFetch`**（最常用），讲 `data` / `pending` / `status` / `refresh` / `pick`。
- **第 12 节**：**`$fetch`**（底层通用请求）、**`useAsyncData`**（更通用的组合式函数，`useFetch` 是它的语法糖）、**`useNuxtData`**（读缓存）。
- **第 13 节**：**请求时机**——默认阻塞跳转、`<NuxtLoadingIndicator>`、`lazy`、`useLazyFetch`/`useLazyAsyncData`、`server: false`（client-only）。

### 三个核心函数的关系（务必先理解）

| 函数 | 类型 | 定位 |
| --- | --- | --- |
| `useFetch` | 组合式函数 | 组件中获取数据**最直接、首选**；自动去重，避免 SSR+CSR 重复请求 |
| `$fetch` | 全局函数 | 偏底层通用请求，基于 `ofetch`（类比 axios）；**不去重** |
| `useAsyncData` | 组合式函数 | 包裹任意异步逻辑并返回结果；更通用、更精确 |

> 核心关系：**`useFetch(url)` ≈ `useAsyncData(url, () => $fetch(url))`**。即 `useFetch` 是 `useAsyncData` + `$fetch` 的语法糖。

> 为什么优先用组合式函数而非直接 `$fetch`/axios？因为 Nuxt 是 SSR 框架，要在前后端都渲染。`useFetch`/`useAsyncData` 能确保**同一请求在服务端首渲发出后，客户端 hydration 阶段不再重复发送**。这是它们最关键的价值。

---

## 2. 核心知识点 + 演示复盘（第 11 节：useFetch）

### 2.1 先修一个中间件 Bug（自动导入要放进函数体内）

第 9-10 节把 `useCurrentUser()` 写在了中间件**函数体外部**（首行）。直接访问需鉴权的 URL（如刷新 `/users/2`）时会报 500：`需要 Nuxt instance`，因为此时 `NuxtApp` 实例还没创建就用了自动导入的 composable。

```ts
// ❌ 错误：自动导入的 composable 放在中间件函数体外
import type { User } from '~/types/user'
const currentUser = useCurrentUser() // 此处过早调用，无 Nuxt 实例

export default defineNuxtRouteMiddleware((to, from) => {
  if (!currentUser.value.isLogin) return navigateTo('/login')
})
```

```ts
// ✅ 正确：放进函数体内部
export default defineNuxtRouteMiddleware((to, from) => {
  const currentUser = useCurrentUser() // 在守卫执行时调用，有 Nuxt 实例
  if (!currentUser.value.isLogin) return navigateTo('/login')
})
```

> 💡 通用规则：**在中间件 / 插件等场景使用自动导入的 composable，要放在函数体内部调用**。Nuxt 3 / 4 都适用。

### 2.2 `useFetch` 基本用法

用免费假数据 API（`https://jsonplaceholder.typicode.com/users/:id`）按路由 `id` 获取用户。先准备类型：

```ts
// app/types/user.ts 追加
export interface UserData {
  id: number
  name: string
  username: string
  email: string
}
```

页面中使用 `useFetch`：

```vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
import type { UserData } from '~/types/user'

const route = useRoute()

// useFetch 传入 URL 即可发请求；用泛型标注返回数据类型
const { data, pending, status, refresh } = await useFetch<UserData>(
  `https://jsonplaceholder.typicode.com/users/${route.params.id}`
)
</script>

<template>
  <div>
    <button @click="() => refresh()">refresh data</button>
    <div v-if="pending">loading...</div>
    <div>status: {{ status }}</div>

    <!-- data 可能为空，用 v-if 做 type guard -->
    <div v-if="data">
      <div>{{ data.name }}</div>
      <div>{{ data.username }}</div>
      <pre>{{ data }}</pre>
    </div>
  </div>
</template>
```

返回对象的常用字段：

| 字段 | 说明 |
| --- | --- |
| `data` | 返回的数据（响应式对象，取值 `data.value`） |
| `pending` | 是否正在加载（loading 状态） |
| `status` | 更详尽的请求状态：`idle` / `pending` / `success` / `error` |
| `refresh()` | 重新发送请求 |

> ⚠️ Nuxt 4 差异（本节重点，逐条对照）
>
> | 项目 | 课程（Nuxt 3） | 我的项目（Nuxt 4） |
> | --- | --- | --- |
> | `data` 默认值 | `null` | **`undefined`** |
> | `error` 默认值 | `null` | **`undefined`** |
> | `data` 响应式 | `ref`（深响应） | **`shallowRef`**（浅响应，改嵌套属性不触发更新；需要深响应加 `deep: true`） |
> | `pending` | 普通状态 | **computed**，仅当 `status` 为 `pending` 时为 `true` |
> | 推荐做法 | 用 `pending` | 官方更推荐用 **`status`** 判断状态 |
>
> 对本例的实际影响：模板里用 `v-if="data"`（真值判断）**不受影响**，无论默认是 `null` 还是 `undefined` 都正确。但如果你写过 `if (data.value === null)`，在 Nuxt 4 要改成 `=== undefined`（或直接用真值判断）。

### 2.3 验证 SSR 不重复请求

- 直接刷新 `/users/1`：是服务端渲染，**前端不会发出 ajax**（数据由服务端直接渲染进 HTML）。
- 从首页**点击** `/users/1`：hydration 已结束，由前端发请求（network 里能看到 GET）。

这印证了 `useFetch` 在前后端是不同逻辑、**不会重复发请求**。

### 2.4 `pick`：只取需要的字段

`useFetch` 第二个参数是请求相关选项（`body`、`method` 等）。其中 `pick` 可筛选返回字段：

```ts
const { data } = await useFetch<UserData>(
  `https://jsonplaceholder.typicode.com/users/${route.params.id}`,
  {
    // 只保留 name 和 username
    pick: ['name', 'username'],
  }
)
```

> ⚠️ Nuxt 4 差异：`pick` 用法不变。但注意——**相同 key 的多次调用现在共享 `data`/`error`/`status`**，因此 `pick`（以及 `deep`/`transform`/`getCachedData`/`default`）在同 key 的调用间必须保持一致，否则行为不可预期。

### 2.5 DevTools 的 Payload 面板

DevTools → Payload 可以观测当前数据发送情况（请求的 id、返回值等），是排查数据获取的好工具。Nuxt 3 / 4 都可用。

---

## 3. 核心知识点 + 演示复盘（第 12 节：$fetch / useAsyncData / useNuxtData）

### 3.1 `$fetch`：底层通用请求

```vue
<script setup lang="ts">
import type { UserData } from '~/types/user'

const route = useRoute()
// $fetch 是全局函数，基于 ofetch，类比 axios
const data = await $fetch<UserData>(
  `https://jsonplaceholder.typicode.com/users/${route.params.id}`
)
</script>
```

与 `useFetch` 的关键区别：
- 返回的是**普通 JS 数据**，不是响应式对象（没有 `pending`/`status`/`refresh`）。
- **不去重**：会在“服务端首渲”和“客户端 hydration”各发一次 → **请求发两次**。

> 结论：`$fetch` 更适合**客户端事件触发的请求**（如点击提交表单）或通用网络请求；首屏数据获取仍应优先 `useFetch`/`useAsyncData`。

> ⚠️ Nuxt 4 差异：`$fetch`（ofetch）行为不变，双重请求问题在 Nuxt 4 同样存在——这正是要用组合式函数的原因。

### 3.2 `useAsyncData`：更通用的组合式函数

`useAsyncData(key, handler)` 用来包裹任意异步逻辑，`useFetch` 是它的语法糖：

```ts
// useFetch(url) 约等于：
const { data } = await useAsyncData<UserData>('user', () => {
  return $fetch(`https://jsonplaceholder.typicode.com/users/${route.params.id}`)
})
```

- 第一个参数 **`key`**：唯一标识，用于**缓存**第二个参数返回的结果（缓存在本地 key-value 结构里）。
- 第二个参数 **`handler`**：返回 Promise 的函数——可以是 `$fetch`、`axios`、或任何第三方异步函数，**比 `useFetch` 更通用**。

它同样**不会在前端重复请求**（避免了 `$fetch` 的双发问题）。

> ⚠️ Nuxt 4 差异（同 key 共享，本节重点）
> Nuxt 4 中，**所有相同 `key` 的 `useAsyncData`/`useFetch` 调用共享同一份 `data`/`error`/`status`**。因此同 key 的调用，`handler`、`deep`、`transform`、`pick`、`getCachedData`、`default` 都必须一致。
> `data` 默认值 `undefined`、`shallowRef`、`pending` 为 computed 等变化同 2.2。

### 3.3 `useNuxtData`：读取缓存做优化

`useAsyncData` 的数据缓存在本地（DevTools → Payload 的 `data` 里能看到）。用 **`useNuxtData(key)`** 可取出缓存，避免重复请求：

```vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
import type { UserData } from '~/types/user'

const route = useRoute()
// 把 id 单独取出，多处复用
const userId = route.params.id

// 缓存 key 带上 id，做到“每个用户一份缓存”
const { data: cachedUser } = useNuxtData<UserData>(`user/${userId}`)

// data 作为最终展示用的数据
const data = ref<UserData | null>(null)

if (cachedUser.value) {
  // 命中缓存：直接赋值，不发请求
  data.value = cachedUser.value
} else {
  // 未命中：发请求，并以同样的 key 写入缓存
  const { data: fetchedUser } = await useAsyncData<UserData>(`user/${userId}`, () => {
    return $fetch(`https://jsonplaceholder.typicode.com/users/${userId}`)
  })
  data.value = fetchedUser.value
}
</script>
```

效果：首次进入某个 `id` 会请求并缓存；之后再进入相同 `id`，直接读缓存、不再发请求。

> ⚠️ Nuxt 4 差异（务必注意默认值不一致）
> - `useNuxtData(key)` 在**无缓存时 `data` 为 `null`**（注意：与 `useFetch`/`useAsyncData` 的默认 `undefined` **不一样**）。所以缓存判断写真值判断 `if (cachedUser.value)` 最稳妥。
> - `getCachedData` 选项在 Nuxt 4 会接收一个 **context 对象**（含本次请求的 `cause`），可用于更精细地决定“用缓存还是重新请求”。
> - 实际项目里，更推荐用 `useAsyncData` 的 `getCachedData` 选项统一管理缓存逻辑，而不是像本例手写 `if/else`（课程为教学循序渐进才手写）。

---

## 4. 核心知识点 + 演示复盘（第 13 节：请求时机）

### 4.1 默认行为：阻塞跳转，等数据再渲染

默认情况下，跳转到需要请求的页面时，**会等数据获取完毕后再跳转/渲染**（底层用 Vue 的 `<Suspense>` 实现）。把网络调成 Slow 3G 能明显看到：点击 `/users/1` → 先发请求 → 请求完才跳转。

### 4.2 `<NuxtLoadingIndicator>`：全局加载进度条

在根组件放内置全局组件 `<NuxtLoadingIndicator>`，可显示任意异步请求的进度（顶部绿色进度条）：

```vue
<!-- app/app.vue -->
<template>
  <div>
    <NuxtLoadingIndicator />
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </div>
</template>
```

### 4.3 `lazy`：先跳转再请求

加 `lazy: true`，则**先完成路由跳转，再开始请求**（类似传统 SPA 在 `onMounted` 里请求）。此时需**手动处理 loading 状态**（用 `pending` + `v-if` 显示 loading 框；注意此模式下 `<NuxtLoadingIndicator>` 不生效）：

```vue
<script setup lang="ts">
const { data, pending } = await useFetch<UserData>(url, {
  lazy: true,
})
</script>

<template>
  <div v-if="pending">loading...</div>
  <div v-else-if="data">{{ data.name }}</div>
</template>
```

快捷方式：**`useLazyFetch`** 和 **`useLazyAsyncData`** 与 `useFetch`/`useAsyncData` 一一对应，自带 `lazy` 效果。

```ts
const { data, pending } = await useLazyFetch<UserData>(url)
```

> ⚠️ Nuxt 4 差异：`lazy` / `useLazyFetch` / `useLazyAsyncData` 用法不变。
> 但 Nuxt 4 中 `pending` 是 computed（仅 `status === 'pending'` 时为 `true`），且当 `immediate: false` 时 `pending` **初始为 `false`**（Nuxt 3 是首次请求前一直 `true`）。如果你的 loading 显示依赖 `pending`，行为会更精确——建议优先用 `status` 判断。

### 4.4 `server: false`：仅客户端请求（client-only）

默认首屏请求在服务端发起（SSR）。加 `server: false` 可改为**仅在客户端、hydration 之后请求**，行为等同普通 SPA：

```ts
const { data, pending } = await useFetch<UserData>(url, {
  server: false,
})
```

此时查看网页源代码，数据**不在 HTML 里**（只有 loading），由 JS 动态填充。

> 💡 讲师不推荐 `server: false`：它丢掉了 Nuxt SSR 的优势（SEO、首屏）。多数场景用默认即可；想要骨架屏，加 `lazy: true` 更合适。

---

## 5. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7） |
| --- | --- | --- |
| `useFetch` / `useAsyncData` 基本用法 | 支持 | 不变 |
| `data` / `error` 默认值 | `null` | **`undefined`** |
| `data` 响应式 | `ref`（深） | **`shallowRef`**（浅；`deep: true` 可开深） |
| `clear()` / `clearNuxtData()` | 重置为 `undefined` | 重置为你提供的 `default` 工厂值 |
| 同 key 调用 | 各自独立 | **共享 `data`/`error`/`status`**，选项须一致 |
| `pending` | 普通状态 | **computed**（仅 `status` pending 时 `true`） |
| `status`（idle/pending/success/error） | 支持 | 支持（更推荐用它） |
| `refresh()` / `pick` / `body` / `method` | 支持 | 不变 |
| `$fetch`（ofetch） | 不去重、双发 | 不变 |
| `useNuxtData(key)` 无缓存默认值 | `null` | `null`（与 fetch 的 `undefined` 不同） |
| `getCachedData` 回调 | `(key, nuxtApp)` | 新增第三参 **context**（含 `cause`） |
| `<NuxtLoadingIndicator>` | 支持 | 不变 |
| `lazy` / `useLazyFetch` / `useLazyAsyncData` | 支持 | 不变（`pending` 语义更精确） |
| `server: false`（client-only） | 支持 | 不变 |

> 结论：数据获取这章 **API 名称与整体写法在 Nuxt 4 都保留**，但**运行时细节变化最多**：默认值 `null→undefined`、`data` 变 `shallowRef`、`pending` 变 computed、同 key 共享 refs。写判空和 loading 逻辑时尤其注意。

---

## 6. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。前置：完成状态管理篇。

1. 修 Bug：把 `app/middleware/auth.ts` 里的 `useCurrentUser()` 移到中间件函数体内部（2.1）。
2. 在 `app/types/user.ts` 追加 `UserData` 接口（2.2）。
3. 在 `app/pages/users/[id].vue` 用 `useFetch<UserData>` 请求 jsonplaceholder，渲染 `data`，加 `pending`/`status`/`refresh`（2.2）。
4. 验证：刷新 `/users/1`（SSR，无 ajax）vs 点击进入（CSR，有 GET）（2.3）。
5. 加 `pick: ['name', 'username']` 体会字段筛选（2.4）。
6. 改用 `$fetch`，打开 network 观察**双发请求**（3.1）。
7. 改用 `useAsyncData('user', () => $fetch(url))`，确认前端不再重复请求（3.2）。
8. 用 `useNuxtData` + `useAsyncData`（key 形如 `user/<id>`）实现缓存命中判断（3.3）。
9. 在 `app/app.vue` 加 `<NuxtLoadingIndicator />`；把网络调 Slow 3G 观察默认阻塞跳转与进度条（4.1 / 4.2）。
10. 加 `lazy: true`（或换 `useLazyFetch`），用 `pending` 手动显示 loading（4.3）。
11. 加 `server: false`，查看网页源代码确认数据不在 HTML 里（4.4）。

> 提示：每次只改一种方式做对比实验，改完注意路由的 `auth` 中间件可能拦截，可临时注释 `definePageMeta` 里的 `middleware`。

---

## 7. 易错点 + 关键 API 速查

### 易错点

- **首选 `useFetch`/`useAsyncData`，别无脑 `$fetch`**：`$fetch` 不去重，首屏会双发请求。
- **`$fetch` 用于客户端事件触发**（点击提交等）或服务端 API 间调用。
- **Nuxt 4 判空改 `undefined`**：`useFetch`/`useAsyncData` 的 `data` 默认 `undefined`；老代码 `=== null` 要改（或直接用真值判断 `v-if="data"`）。
- **`useNuxtData` 无缓存是 `null`**，与上面 `undefined` 不一致，缓存判断用真值判断最稳。
- **`data` 是 `shallowRef`**：直接改嵌套属性可能不触发视图更新；需要时加 `deep: true` 或整体替换 `data.value = {...}`。
- **同 key 选项要一致**：相同 key 的 `useFetch`/`useAsyncData`，`pick`/`transform`/`deep`/`default` 等必须相同。
- **响应式取值加 `.value`**：`data`、`pending`、`status` 在 `<script>` 里取值要 `.value`（模板里自动解包）。
- **中间件里的自动导入放函数体内**（见 2.1）。
- **`server: false` 牺牲 SSR**：会丢 SEO/首屏优势，慎用。

### 关键 API / 概念速查

| 名称 | 作用 | 备注 |
| --- | --- | --- |
| `useFetch(url, opts?)` | 首选数据获取 | 自动去重；`useAsyncData`+`$fetch` 语法糖 |
| `$fetch(url, opts?)` | 底层通用请求 | 基于 ofetch；不去重 |
| `useAsyncData(key, handler, opts?)` | 通用异步获取 | `key` 用于缓存；`handler` 返回 Promise |
| `useNuxtData(key)` | 读取缓存 | 无缓存时 `data` 为 `null` |
| `data` / `error` | 数据 / 错误 | Nuxt 4 默认 `undefined`、`shallowRef` |
| `pending` / `status` | 加载状态 | Nuxt 4 `pending` 为 computed；推荐用 `status` |
| `refresh()` | 重新请求 | — |
| `pick: []` | 筛选返回字段 | 同 key 须一致 |
| `lazy: true` / `useLazyFetch` / `useLazyAsyncData` | 先跳转后请求 | 需手动处理 loading |
| `server: false` | 仅客户端请求 | 牺牲 SSR |
| `<NuxtLoadingIndicator>` | 全局加载进度条 | 放根组件 |

---

> 小结：①三函数关系 `useFetch ≈ useAsyncData + $fetch`，首屏优先组合式函数避免双发；②`data/pending/status/refresh/pick` 常用字段；③`useNuxtData` 读缓存优化；④请求时机：默认阻塞、`lazy` 先跳转、`server:false` 纯客户端；⑤**Nuxt 4 重写了数据层**——默认值 `null→undefined`、`data` 变 `shallowRef`、`pending` 变 computed、同 key 共享 refs，是本章最需留意的差异。
