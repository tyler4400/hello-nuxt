# 第 20-6 节：Pages 概念（文件式路由）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 6 节
> 本文基于课程视频（Nuxt 3）整理，并以我本地的 Nuxt 4 项目 `**/Users/tylerzzheng/Code/Nuxt/hello-nuxt**` 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节，核心差异同样是：约定目录在 `**app/**` 下。

---

## 1. 概述

上一节学了自动导入。这一节进入 Nuxt 另一个核心约定 —— **Pages（文件式路由）**。

一句话概括：**在 `pages/` 文件夹里放 `.vue` 文件，Nuxt 会根据文件路径自动生成对应的路由**，无需手写路由表。底层仍然是我们熟悉的 Vue Router。

这一节做三件事：

- 创建 `index.vue` / `login.vue` 两个静态页面，用 `<NuxtPage />` 渲染，并验证 SSR。
- 用 `[id].vue` 创建动态路由。
- 用 Nuxt DevTools 查看已注册的路由、组件、composables。

> ⚠️ Nuxt 4 差异（目录位置）
> 课程的页面目录是根目录 `pages/`；我的项目是 `**app/pages/`**。
> 注意：`app/pages/` 文件夹默认**不存在**，需要你手动创建。一旦创建，Nuxt 会启用文件式路由（没有 `pages/` 时，`app.vue` 就是唯一页面）。

---

## 2. 核心知识点 + 演示复盘

### 2.1 文件式路由：创建静态页面

按项目需要，先建一个系统首页和一个登录页。

```vue
<!-- 课程：pages/index.vue ｜ 我的项目：app/pages/index.vue -->
<template>
  <div>home page</div>
</template>
```

```vue
<!-- 课程：pages/login.vue ｜ 我的项目：app/pages/login.vue -->
<template>
  <div>login</div>
</template>
```

文件名与路由的对应关系：


| 文件                | 生成的路由    |
| ----------------- | -------- |
| `pages/index.vue` | `/`      |
| `pages/login.vue` | `/login` |


> ⚠️ Nuxt 4 差异：仅仅是把上面两个文件放到 `app/pages/` 下，生成的路由（`/`、`/login`）完全一样。

### 2.2 用 `<NuxtPage />` 渲染页面

光建页面还不够，要在入口组件里放一个 `**<NuxtPage />**` 占位符，匹配到的页面会被动态塞进这里。

```vue
<!-- 课程：app.vue ｜ 我的项目：app/app.vue -->
<template>
  <div>
    <NuxtRouteAnnouncer />
    <!-- NuxtPage 是页面占位符：根据当前路由动态渲染对应 pages 组件 -->
    <NuxtPage />
  </div>
</template>
```

要点：

- `<NuxtPage />` 是 Nuxt 内置全局组件，作用类似“页面区域的占位/插槽”。
- 它底层基于 Vue Router 的 `<RouterView>`，根据路由匹配动态加载并渲染对应页面组件。
- 课程演示时把 `app.vue` 里原来的 `<HelloWorld />`（上一节加的）删掉，换成 `<NuxtPage />`。

> ⚠️ Nuxt 4 差异（入口默认内容 + vue-router 版本）
>
> - 入口是 `app/app.vue`，默认带 `<NuxtRouteAnnouncer />`，复刻时保留它、加上 `<NuxtPage />` 即可。
> - 课程底层是 vue-router 4，我的项目实测是 **vue-router 5.1.0**。但 `<NuxtPage />` / `<RouterView>` 的行为对使用者一致，无需关心。

> 💡 易踩坑：`app/pages/` 是**新建**的文件夹，和上一节一样 —— Nuxt 监控系统还没纳入它，路由可能不生效，**需要重启 dev server**。重启后 `/` 和 `/login` 才会出现。

### 2.3 验证服务器端渲染（SSR）

访问 `/login`，在浏览器里“查看网页源代码”。如果 `login page` 的 `<h1>` 文本**直接出现在 HTML 源码里**，就证明首屏是**服务器端渲染**的，对 SEO 有利。

> 这一点 Nuxt 3 / 4 一致：默认就是 SSR（universal rendering），首屏由服务端产出 HTML。

### 2.4 动态路由：`[id].vue`

除了完全静态的 URL，常见的还有动态 URL，比如按用户 ID 查看不同用户：`/users/1234`、`/users/3456`。

动态路由仍然靠文件命名实现 —— **用方括号 `[ ]` 包裹参数名**。

目录与文件：

```text
app/pages/
└─ users/
   └─ [id].vue        # 匹配 /users/任意值，参数名为 id
```

```vue
<!-- 课程：pages/users/[id].vue ｜ 我的项目：app/pages/users/[id].vue -->
<template>
  <div>user detail page</div>
</template>
```

要点：

- 方括号**在文件夹名或文件名里都能用**，`[id]` 中的 `id` 名称可自定义（取贴切的名字即可）。
- 访问 `/users/1234`、`/users/2345` 都会命中 `[id].vue`。
- 想匹配 `/users` 本身（列表页），再加一个 `app/pages/users/index.vue`：

```vue
<!-- app/pages/users/index.vue -->
<template>
  <div>user index page</div>
</template>
```

完整对应关系：


| 文件                          | 生成的路由                         |
| --------------------------- | ----------------------------- |
| `app/pages/users/index.vue` | `/users`                      |
| `app/pages/users/[id].vue`  | `/users/:id`（如 `/users/1234`） |


> ⚠️ Nuxt 4 差异：动态路由语法 `[id].vue`、嵌套目录规则与 Nuxt 3 **完全相同**，只是整体在 `app/pages/` 下。

### 2.5 Nuxt DevTools 查看路由

打开 DevTools（`nuxt.config.ts` 里 `devtools: { enabled: true }`，我的项目默认开启），可以非常直观地看到：

- **Pages**：当前激活路由（如 `users-id active`）、以及应用中已注册的全部路由（`index`、`login`、`users-index`、`users-id` 等）。
- **Components**：自动加载的组件，分用户组件（如上一节的 `HelloWorld`）、内置组件、运行时组件。
- **Imports**：自动导入的 composables，分用户 composable（如 `useKeyPress`）和大量内置 composable。

> 💡 DevTools 在 Nuxt 3 / 4 都可用，是排查“路由有没有注册成功、组件/composable 有没有被自动导入”的利器。

---

## 3. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）


| 维度       | 课程（Nuxt 3）          | 我的项目（Nuxt 4.4.7，实测）                         |
| -------- | ------------------- | ------------------------------------------- |
| 页面目录     | `pages/`            | `app/pages/`（需手动新建）                         |
| 入口文件     | `app.vue`           | `app/app.vue`（默认含 `<NuxtRouteAnnouncer />`） |
| 页面占位组件   | `<NuxtPage />`      | `<NuxtPage />`（不变）                          |
| 静态路由规则   | `index.vue` → `/`   | 完全一致                                        |
| 动态路由语法   | `[id].vue`          | `[id].vue`（不变）                              |
| 嵌套路由     | `users/index.vue` 等 | 完全一致                                        |
| 底层路由库    | vue-router 4        | **vue-router 5.1.0**（使用层一致）                 |
| SSR 首屏   | 默认开启                | 默认开启                                        |
| DevTools | 可用                  | 可用（默认开启）                                    |


> 结论：Pages 这一节，Nuxt 4 与课程**唯一的实质差异就是 `pages/` → `app/pages/`**，其余语法、组件、行为完全一致。

---

## 4. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。

1. 新建文件夹与首页 `app/pages/index.vue`（内容见 2.1）。
2. 新建登录页 `app/pages/login.vue`（内容见 2.1）。
3. 编辑 `app/app.vue`，把上一节的 `<HelloWorld />` 换成 `<NuxtPage />`（保留 `<NuxtRouteAnnouncer />`）。
4. **重启 dev server**（新建了 `app/pages/` 文件夹）：

```bash
npm run dev
```

1. 访问验证：
  - `http://localhost:3000/` → 显示 `home page`
  - `http://localhost:3000/login` → 显示 `login`
2. 在 `/login` 页“查看网页源代码”，确认 `login` 文本在 HTML 源码里（验证 SSR）。
3. 新建动态路由 `app/pages/users/[id].vue`（内容见 2.4），访问 `/users/1234`、`/users/2345` 验证都命中。
4. 新建 `app/pages/users/index.vue`，访问 `/users` 验证列表页。
5. 打开 Nuxt DevTools 的 Pages 面板，查看已注册的全部路由。

---

## 5. 易错点 + 关键 API 速查

### 易错点

- **新建 `app/pages/` 后必须重启 dev server**：否则路由不生效（与新建任何约定目录同理）。
- **忘记放 `<NuxtPage />`**：页面建好了但页面区域不渲染——入口组件必须有 `<NuxtPage />` 作为占位。
- **动态参数名一致性**：`[id].vue` 里参数名是 `id`，下一节用 `useRoute().params.id` 取值时名字必须对应（见 07-08 篇）。
- `**index.vue` 才是“该层根路由”**：`users/` 下没有 `index.vue` 时，直接访问 `/users` 不会有页面。
- **Nuxt 4 路径别漏 `app/`**：页面要放 `app/pages/`，不是根目录 `pages/`。

### 关键 API / 概念速查


| 名称                        | 作用                         |
| ------------------------- | -------------------------- |
| `app/pages/`（课程 `pages/`） | 文件式路由目录                    |
| `<NuxtPage />`            | 页面占位符，渲染匹配到的页面组件           |
| `index.vue`               | 该层级的根路由（`/`、`/users`）      |
| `[id].vue`                | 动态路由，参数名为方括号内的名称           |
| `users/[id].vue`          | 嵌套 + 动态，匹配 `/users/:id`    |
| Nuxt DevTools             | 查看路由 / 组件 / imports 的可视化面板 |


---

> 小结：①`pages/` 文件即路由，`index.vue`→`/`；②`<NuxtPage />` 是页面占位符，底层是 vue-router；③`[id].vue` 做动态路由；④Nuxt 4 唯一差异是目录变 `app/pages/`，语法全不变。

