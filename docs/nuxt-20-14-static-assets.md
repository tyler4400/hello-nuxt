# 第 20-14 节：静态文件处理（public / assets）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 14 节
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节。

---

## 1. 概述

这一节讲一个相对简单的基础知识：**静态文件处理**。Nuxt 用两个文件夹组织静态资源，定位完全不同：

| 文件夹 | 定位 | 是否经构建工具处理 | 能否通过 URL 直接访问 |
| --- | --- | --- | --- |
| `public/` | 静态服务器的“根路径” | ❌ 原样复制 | ✅ 可以（如 `/logo.png`） |
| `assets/` | 未编译资源（样式/图片等） | ✅ 经 Vite/webpack 处理 | ❌ 不能（直接访问会 404） |

> ⚠️ Nuxt 4 关键差异（先记住）
> - `public/`：在**项目根目录**（Nuxt 3 / 4 都一样）。
> - `assets/`：课程在**项目根目录**；我的 Nuxt 4 项目在 **`app/assets/`**（需手动创建）。
> - `~` / `@` 别名：Nuxt 3 指**项目根**，Nuxt 4 指 **`app/`**（srcDir）。所以引用 assets 的写法 `~/assets/...` **不变**，但它的含义从“根目录/assets”变成了“app/assets”。

---

## 2. 核心知识点 + 演示复盘

### 2.1 `public/` 文件夹

把 `public/` 看作**静态服务器的根路径**：里面的文件会被**原封不动**复制到构建输出目录，并能通过 URL 直接访问。

例如 `public/logo.png`、`public/style.css`，可直接通过 `/logo.png`、`/style.css` 访问。在 `app.vue` 里引用图片：

```vue
<!-- 课程：app.vue ｜ 我的项目：app/app.vue -->
<template>
  <div>
    <!-- public 下的文件用「绝对 URL」引用，public 即根目录 -->
    <img src="/logo.png" alt="logo" />
  </div>
</template>
```

> ⚠️ Nuxt 4 差异：`public/` 位置与引用方式（`/logo.png`）**完全不变**。它始终在项目根目录，不在 `app/` 下。适合放 `favicon.ico`、`robots.txt` 等需保持文件名、不需编译的资源。

### 2.2 `assets/` 文件夹

`assets/` 存放**需要构建工具处理**的未编译资源：

- 需编译的样式：Sass、Less、Stylus 等。
- 需 bundler（默认 Vite）处理后才使用的图像等。

引用时必须用 **`~` 别名**（不能用绝对 URL）：

```vue
<!-- 课程：assets 在根目录 ｜ 我的项目：assets 在 app/assets/ -->
<template>
  <div>
    <!-- assets 下的文件用「~ 别名」引用，会经 Vite 处理 -->
    <img src="~/assets/logo.png" alt="logo" />
  </div>
</template>
```

单看一张图片，`public` 和 `assets` 的显示效果差不多，但两者机制不同：

- `assets/` 的文件**不会生成静态 URL**——直接访问 `/assets/logo.png` 会返回 **404**。
- `assets/` 的文件经过了 Vite 处理（可做哈希、压缩、按需打包等）。

> ⚠️ Nuxt 4 差异（重点澄清讲师的说法）
> 讲师说“波浪线 `~` 表示项目的根目录”——这是 **Nuxt 3** 的说法。
> 在 **Nuxt 4**，`~` / `@` 指向 **`app/`（srcDir）**，而 `~~` / `@@` 才指向项目根（rootDir）。
> 由于 `assets/` 在 Nuxt 4 也一起移到了 `app/assets/`，所以 `~/assets/logo.png` 的**写法不用改**，解析结果正确（= `app/assets/logo.png`）。
> 官方别名表（Nuxt 4）：`~`→`app/`、`assets`→`app/assets`、`public`→`public`、`~~`→根目录。

### 2.3 在项目中引入 CSS（assets 下的样式）

样式文件常需 bundler 处理，假设已有 `app/assets/style.css`。组件里引入有两种方式：

**方式一：在组件 `<style>` 块里 `@import`**

```vue
<style>
/* 经 Vite 处理，路径写法与 ~ 别名一致 */
@import '~/assets/style.css';
</style>
```

**方式二：在 `<script setup>` 里 `import`**

```vue
<script setup lang="ts">
// 正因为经过 Vite 处理，才能这样直接 import 样式
import '~/assets/style.css'
</script>
```

两种方式效果一致（如把页面背景改成蓝色）。

> ⚠️ Nuxt 4 差异：两种 CSS 引入方式都不变，路径仍用 `~/assets/...`（解析到 `app/assets/`）。
> 💡 如果想“一劳永逸”地全局引入某个 CSS（而不是逐个组件引入），用 `nuxt.config.ts` 的 `css` 数组——这是下一节（SEO 篇）的内容。

---

## 3. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7，实测） |
| --- | --- | --- |
| `public/` 位置 | 项目根 | 项目根（不变） |
| `public/` 引用 | `/logo.png` | `/logo.png`（不变） |
| `assets/` 位置 | 项目根 `assets/` | **`app/assets/`**（需手动创建） |
| `assets/` 引用 | `~/assets/logo.png` | `~/assets/logo.png`（写法不变） |
| `~` / `@` 别名 | 项目根 | **`app/`（srcDir）** |
| `~~` / `@@` 别名 | 项目根 | 项目根（rootDir） |
| `assets` 别名 | 根/assets | `app/assets` |
| CSS `@import` / `import` | 支持 | 不变 |
| 直接 URL 访问 assets | 404 | 404（不变） |

> 结论：本节差异集中在 **`assets/` 移到 `app/assets/`** 和 **`~` 别名含义（根 → app/）**；因为两者同步变化，实际**引用写法不用改**。`public/` 全程不变。

---

## 4. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。现状：`public/` 已有 `favicon.ico`、`robots.txt`；`app/` 下暂无 `assets/`。

1. **public 实验**：放一张 `public/logo.png`，在 `app/app.vue` 用 `<img src="/logo.png" />` 引用，启动后访问首页确认显示；浏览器直接打开 `http://localhost:3000/logo.png` 也能访问。
2. **assets 实验**：手动新建 `app/assets/`，放一张 `app/assets/logo.png`，用 `<img src="~/assets/logo.png" />` 引用，确认显示效果一致。
3. 验证差异：浏览器直接访问 `http://localhost:3000/assets/logo.png` → 返回 **404**（证明 assets 不生成静态 URL）。
4. **CSS 实验**：新建 `app/assets/style.css`（如 `body { background: lightblue; }`），用 2.3 的任一方式在 `app/app.vue` 引入，确认背景变色。

```bash
npm run dev
```

> 💡 提示：本项目装了 `@nuxtjs/tailwindcss`，它会注入自己的样式；你手写的 `app/assets/style.css` 与 Tailwind 可以共存，互不影响。

---

## 5. 易错点 + 关键 API 速查

### 易错点

- **public 用绝对 URL，assets 用 `~` 别名**：`public/logo.png` → `/logo.png`；`app/assets/logo.png` → `~/assets/logo.png`。两者不可混用。
- **assets 不能直接 URL 访问**：直接访问 `/assets/xxx` 是 404，它只在构建/引用时被 Vite 处理。
- **Nuxt 4 的 `~` 不是“项目根”**：它是 `app/`。要指项目根用 `~~` / `@@`。
- **assets 必须放 `app/assets/`**（Nuxt 4），放根目录 `assets/` 不会被当作约定的 assets 目录处理。
- **新建 `app/assets/` 文件夹后**，若引用报错，重启一次 dev server。

### 关键概念速查

| 名称 | 作用 | 引用方式 |
| --- | --- | --- |
| `public/`（根目录） | 原样复制的静态资源 | 绝对 URL，如 `/logo.png` |
| `app/assets/`（课程根 `assets/`） | 经 Vite 处理的未编译资源 | `~` 别名，如 `~/assets/logo.png` |
| `~` / `@` | srcDir 别名 | Nuxt 4 = `app/` |
| `~~` / `@@` | rootDir 别名 | 项目根 |
| `@import` / `import` 样式 | 在组件引入 CSS | `~/assets/style.css` |

---

> 小结：①`public/` = 静态服务器根，绝对 URL 访问，位置全程不变；②`app/assets/`（课程在根目录）= 经 Vite 处理的资源，用 `~` 别名引用、不生成静态 URL；③Nuxt 4 里 `~` 指 `app/`（不再是项目根），但因 assets 同步迁移，引用写法不用改。
