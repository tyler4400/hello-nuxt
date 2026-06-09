# 第 20-7 / 20-8 节：路由相关 API 与中间件（Middleware）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 7 节 + 第 8 节（合并）
> 本文基于课程视频（Nuxt 3）整理，并以我本地的 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节，核心差异同样是：约定目录在 **`app/`** 下。

---

## 1. 概述

上一节学了 Pages 文件式路由。这一节（第 7、8 两节连续讲解）补齐和路由配套的两块内容：

- **Part 1 路由相关 API**（第 7 节前半）：`<NuxtLink>` 导航、`useRoute` 取参、`useRouter` 程序化跳转。
- **Part 2 ~ Part 5 中间件 Middleware**（第 7 节后半 + 第 8 节）：这是 Nuxt 的“路由守卫”改版，包含中间件入门、三种形式、执行顺序、`abortNavigation` 与 SSR/CSR 行为差异。

> ⚠️ Nuxt 4 差异（贯穿全篇）
> - 中间件目录：课程 `middleware/` → 我的项目 **`app/middleware/`**（需手动新建）。
> - 底层路由库：课程 vue-router 4 → 我的项目实测 **vue-router 5.1.0**，但 `<NuxtLink>` / `useRoute` / `useRouter` / 导航守卫签名对使用者一致。
> - 全局函数 `defineNuxtRouteMiddleware`、`navigateTo`、`abortNavigation`、`definePageMeta` 在 Nuxt 4 **完全保留、用法不变**（都自动导入，无需手写 import）。

---

## 2. Part 1：路由相关 API（第 7 节前半）

### 2.1 `<NuxtLink>` 导航（内部 / 外部）

Nuxt 提供全局组件 `<NuxtLink>` 完成导航，它是 vue-router 的 `<RouterLink>` 的扩展变种，熟悉 `<RouterLink>` 的话会很亲切。

在入口组件加一个头部导航：

```vue
<!-- 课程：app.vue ｜ 我的项目：app/app.vue -->
<template>
  <div>
    <NuxtRouteAnnouncer />
    <nav>
      <!-- 内部导航：跳转到已定义的内部路由 -->
      <NuxtLink to="/">Home</NuxtLink>
      <NuxtLink to="/login">Login</NuxtLink>
      <!-- 外部导航：加 external，会渲染成普通 <a> 标签 -->
      <NuxtLink to="https://nuxt.com" external>Nuxt Docs</NuxtLink>
    </nav>
    <NuxtPage />
  </div>
</template>
```

要点：
- **内部导航**：`<NuxtLink to="/login">`，跳转到页面里已定义好的路由，走客户端路由（SPA 式，不刷新整页）。
- **外部导航**：加 `external` 属性，告诉 `<NuxtLink>` 这是外链，它会转换成一个 `<a>` 标签，工作原理与内部导航完全不同。

> ⚠️ Nuxt 4 差异：`<NuxtLink>` 用法不变。入口文件是 `app/app.vue` 且默认带 `<NuxtRouteAnnouncer />`，复刻时保留它即可。

### 2.2 `useRoute()`：获取当前路由信息

需要拿到链接上的参数（params、query 等）时，用全局 composable `useRoute()`（无需 import）。

在动态路由页面里取出 `id` 参数：

```vue
<!-- 课程：pages/users/[id].vue ｜ 我的项目：app/pages/users/[id].vue -->
<template>
  <div>user detail page {{ route.params.id }}</div>
</template>

<script setup lang="ts">
// useRoute 是全局 composable，自动导入
const route = useRoute()
// 这里的 id 必须与文件名 [id].vue 中的参数名一一对应
console.log(route.params.id)
</script>
```

访问 `/users/2`，页面与控制台都会输出 `2`。

要点：
- `route.params.id` 的 `id` 名称，**必须和文件名 `[id].vue` 里的方括号参数名一致**。
- `route` 上还有 `query`、`path`、`name` 等属性，可查文档。

> ⚠️ Nuxt 4 差异：`useRoute` 用法不变；底层虽是 vue-router 5，`route.params` / `route.query` 结构一致。

### 2.3 `useRouter()`：程序化跳转

不点击链接、而是用代码动态跳转时，用 `useRouter()`（同样是 vue-router 的 `useRouter` 被 Nuxt 做成了全局 composable）。

```vue
<script setup lang="ts">
const router = useRouter()

const goLogin = () => {
  // 程序化跳转
  router.push('/login')
}
</script>
```

> 课程里讲师未演示 `useRouter`（说之前用过很多次），这里补一个最小示例。Nuxt 里更推荐用全局函数 `navigateTo()` 做跳转（见 Part 2）。

---

## 3. Part 2：中间件入门（第 7 节后半）

### 3.1 什么是中间件

中间件（middleware）是 Nuxt 的全新概念，本质是 **vue-router「路由守卫」的文件系统改版**：在进入某个路由前做一些处理（如权限判断），比手写路由守卫更方便、直观。

### 3.2 写第一个命名中间件

在中间件目录新建 `auth.ts`，判断有没有权限，没有就跳登录页。

```ts
// 课程：middleware/auth.ts ｜ 我的项目：app/middleware/auth.ts

// 判断是否已登录；真实项目里会请求接口（异步），这里先写死 false 试验
const isAuthenticated = (): boolean => {
  return false
}

// 必须用全局函数 defineNuxtRouteMiddleware 包裹一个回调
// 回调参数 to（目标路由）、from（来源路由），与路由守卫一致
export default defineNuxtRouteMiddleware((to, from) => {
  if (!isAuthenticated()) {
    // 没权限就跳转到 login；注意：navigateTo 必须 return
    return navigateTo('/login')
  }
})
```

要点：
- 用全局函数 **`defineNuxtRouteMiddleware`** 定义（自动导入，无需 import）。
- 回调的 `(to, from)` 与 vue-router 的 `NavigationGuard` 参数一致。
- 跳转用全局函数 **`navigateTo()`**，**必须 `return`**（见 Part 5 易错点）。

### 3.3 在页面挂载中间件：`definePageMeta`

定义好中间件后，用全局函数 **`definePageMeta`** 在页面里挂载它。比如保护用户详情页：

```vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
definePageMeta({
  // middleware 是数组，可挂多个；名称对应中间件文件名
  middleware: ['auth'],
})
</script>
```

效果：从首页点击进入 `/users/1`，因为 `isAuthenticated()` 返回 `false`，被中间件重定向到 `/login`。

> ⚠️ Nuxt 4 差异：`defineNuxtRouteMiddleware` / `navigateTo` / `definePageMeta` 全部保留、用法不变；中间件文件放 `app/middleware/`。

---

## 4. Part 3：中间件的三种形式（第 8 节前半）

### 4.1 形式一：命名中间件（named）

就是 Part 2 的写法：在 `app/middleware/` 建独立文件（如 `auth.ts`），再用 `definePageMeta({ middleware: ['auth'] })` 在页面引用。被引用时才执行。

### 4.2 形式二：内联中间件（inline / anonymous）

直接在 `definePageMeta` 的 `middleware` 数组里写一个函数，不需要单独建文件。

```vue
<!-- app/pages/users/[id].vue -->
<script setup lang="ts">
definePageMeta({
  middleware: [
    // 内联中间件：访问 id 为 '2' 的用户时，直接跳回首页
    (to, from) => {
      // ⚠️ params.id 是 string 类型，必须写字符串 '2'，不能写数字 2
      if (to.params.id === '2') {
        return navigateTo('/')
      }
    },
    'auth', // 命名中间件
  ],
})
</script>
```

执行验证（数组顺序很关键）：
- 点击 `/users/1`：内联中间件不拦截 → 执行 `auth` → 跳 `/login`。
- 点击 `/users/2`：内联中间件命中 → 跳首页 `/`（`auth` 不再执行，因为它排在数组后面）。

> 结论：**页面级中间件（命名 + 内联）按 `middleware` 数组的顺序依次执行**。

### 4.3 形式三：全局中间件（global）

文件名加 **`.global`** 后缀，即成为全局中间件 —— **每次路由切换都会执行**，无需在页面里挂载。

```ts
// app/middleware/test.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  console.log('test global middleware')
})
```

不管访问哪个路由，控制台都会打印 `test global middleware`。

---

## 5. Part 4：中间件执行顺序与控制（第 8 节后半）

### 5.1 多个全局中间件：默认按文件名字母序

再加一个全局中间件：

```ts
// app/middleware/setup.global.ts
export default defineNuxtRouteMiddleware((to, from) => {
  console.log('setup global middleware')
})
```

`setup`（S）排在 `test`（T）前面，所以默认执行顺序是 **setup → test**。

### 5.2 用数字前缀控制全局顺序

想让 `test` 先执行，给文件名加数字前缀：

```text
app/middleware/
├─ 1.test.global.ts      # 先执行（前缀 1）
├─ 2.setup.global.ts     # 后执行（前缀 2）
└─ auth.ts               # 命名中间件（被页面引用时才执行）
```

此时执行顺序变为 **test → setup**。

### 5.3 完整执行顺序总结

| 阶段 | 类型 | 排序规则 |
| --- | --- | --- |
| 1️⃣ 先执行 | 全局中间件（`.global`） | 按文件名**字母序**（可用数字前缀干预） |
| 2️⃣ 后执行 | 页面级中间件（命名 + 内联） | 按 `definePageMeta` 里 `middleware` **数组顺序** |

### 5.4 DevTools 查看中间件

DevTools 的 Pages 面板里能看到：
- 每个路由（如 `users-id`）上配置的中间件（如内联 + `auth`）。
- 全局中间件带**绿色标识**；Nuxt 自带两个全局中间件 **`validate`** 和 **`manifest-route-rule`**。

---

## 6. Part 5：`abortNavigation` 与 SSR / CSR 行为差异（第 8 节）

### 6.1 `abortNavigation`：中止导航

除了 `navigateTo`（跳到某路由），中间件里还能用全局函数 **`abortNavigation()`** 直接中止当前导航。

```ts
// app/middleware/auth.ts（演示 abortNavigation）
export default defineNuxtRouteMiddleware((to, from) => {
  if (to.params.id === '2') {
    // 中止导航：点击对应链接时“没有任何反应”
    return abortNavigation()
    // 也可带错误信息：return abortNavigation('error here')
  }
})
```

### 6.2 SSR vs CSR：同一段逻辑两种表现（重点）

讲师强调 Nuxt 是前后端一体框架，中间件在**服务端渲染（SSR）**和**客户端（CSR）**下表现不同：

| 触发方式 | 运行环境 | `abortNavigation()` 表现 | `abortNavigation('error here')` 表现 |
| --- | --- | --- | --- |
| 在页面内**点击**链接进入 `/users/2` | 客户端（Browser / CSR） | 点击无反应，停留原地 | 同样无反应 |
| 在地址栏**直接访问** `/users/2` | 服务端（SSR） | 返回 **404** | 返回 **500**，并显示 `error here` |

要点：
- 直接访问 URL 是 SSR 过程，中间件在服务端就拦截 → 返回错误状态码。
- 页面内点击是客户端路由行为 → 表现为“无反应”。
- `abortNavigation(error)` 的参数用于自定义服务端返回的错误信息；整个错误页面后续也可自定义（后续课程展开）。

---

## 7. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7，实测） |
| --- | --- | --- |
| 中间件目录 | `middleware/` | `app/middleware/`（需手动新建） |
| 路由库 | vue-router 4 | **vue-router 5.1.0**（使用层一致） |
| `<NuxtLink>` / `external` | 支持 | 支持（不变） |
| `useRoute` / `useRouter` | 全局 composable | 全局 composable（不变） |
| `defineNuxtRouteMiddleware` | 支持 | 支持（不变） |
| `navigateTo` / `abortNavigation` | 支持 | 支持（不变） |
| `definePageMeta` | 支持 | 支持（不变） |
| `.global` 全局中间件 | 支持 | 支持（不变） |
| 数字前缀控制顺序 | 支持 | 支持（不变） |
| 自带全局中间件 | `validate`、`manifest-route-rule` | 同样存在 |

> 结论：第 7、8 节涉及的所有 API / 概念，Nuxt 4 **全部保留、用法一致**；唯一目录差异是 `middleware/` → `app/middleware/`。

---

## 8. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。前置：已完成第 6 节的 pages（`index`、`login`、`users/[id]`、`users/index`）。

1. 在 `app/app.vue` 加头部导航 `<nav>`（含内部 `<NuxtLink>` 与一个 `external` 外链），见 2.1。
2. 在 `app/pages/users/[id].vue` 用 `useRoute()` 输出 `route.params.id`，访问 `/users/2` 验证输出 `2`。
3. 新建 `app/middleware/auth.ts`（命名中间件，见 3.2）。
4. 在 `app/pages/users/[id].vue` 加 `definePageMeta({ middleware: ['auth'] })`。
5. **重启 dev server**（新建了 `app/middleware/` 文件夹）：

```bash
npm run dev
```

6. 从首页点击进入 `/users/1`，确认被重定向到 `/login`。
7. 给 `middleware` 数组加一个内联中间件（`id === '2'` → 跳首页，见 4.2），验证点击 `/users/1` 与 `/users/2` 的不同结果。
8. 新建 `app/middleware/test.global.ts`、`app/middleware/setup.global.ts`，任意切换路由，观察控制台打印顺序（默认 setup → test）。
9. 把文件改名为 `1.test.global.ts`、`2.setup.global.ts`，重启后确认顺序变为 test → setup。
10. 把 `auth.ts` 改成 `abortNavigation()`，分别用“点击”和“地址栏直接访问 `/users/2`”验证 CSR 无反应 / SSR 返回 404；再换 `abortNavigation('error here')` 验证 SSR 返回 500 + 错误信息。
11. 打开 DevTools 的 Pages 面板，查看路由上的中间件与自带的 `validate`、`manifest-route-rule` 全局中间件。

---

## 9. 易错点 + 关键 API 速查

### 易错点

- **`navigateTo` 必须 `return`**：在中间件里写 `navigateTo('/login')` 而不 `return`，跳转流程不保证正确。Nuxt 4 文档明确要求 `return navigateTo(...)`。
- **`params.id` 是字符串**：动态参数永远是 `string`（或 `string[]`），判断时写 `'2'` 而非 `2`。
- **中间件名称会被 kebab-case 化（课程未强调）**：命名中间件文件名若是驼峰 `someMiddleware.ts`，在 `definePageMeta` 里要写成 kebab-case `'some-middleware'`。课程例子是 `auth.ts` → `'auth'` 恰好一致，没体现这一点，自定义多词名称时务必注意。
- **`.global` 后缀拼写**：少了 `.global` 就变成普通命名中间件，不会全局执行。
- **执行顺序别记反**：全局（字母序）在前，页面级（数组序）在后。
- **新建 `app/middleware/` 后必须重启 dev server**。
- **外链忘记 `external`**：`<NuxtLink>` 指向站外地址但不加 `external`，会被当成内部路由处理而出错。
- **SSR / CSR 行为差异**：直接访问 URL（SSR）和页面内点击（CSR）对同一中间件可能表现不同，调试时要分清入口。

### 关键 API / 概念速查

| 名称 | 作用 | 说明 |
| --- | --- | --- |
| `<NuxtLink to="...">` | 内部导航 | 客户端路由跳转 |
| `<NuxtLink to="..." external>` | 外部导航 | 渲染为 `<a>` 标签 |
| `useRoute()` | 获取当前路由 | 取 `params` / `query` / `path` 等 |
| `useRouter()` | 路由实例 | `router.push()` 等程序化跳转 |
| `defineNuxtRouteMiddleware(cb)` | 定义中间件 | 回调参数 `(to, from)` |
| `navigateTo(path)` | 跳转 | **必须 `return`** |
| `abortNavigation(error?)` | 中止导航 | 可带自定义错误信息 |
| `definePageMeta({ middleware })` | 页面挂载中间件 | 数组，可命名 + 内联混用 |
| `*.global.ts` | 全局中间件 | 每次路由切换都执行 |
| `app/middleware/`（课程 `middleware/`） | 中间件目录 | 命名/全局中间件存放处 |

---

> 小结：①`<NuxtLink>`（含 `external`）+ `useRoute` / `useRouter` 处理导航与取参；②中间件是路由守卫的文件式改版，三种形式：命名、内联、全局（`.global`）；③执行顺序：全局（字母序）→ 页面级（数组序）；④`navigateTo` 跳转、`abortNavigation` 中止，且 SSR/CSR 表现不同；⑤Nuxt 4 全部 API 不变，仅目录变 `app/middleware/`。
