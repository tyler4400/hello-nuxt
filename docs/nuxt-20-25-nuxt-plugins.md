# 第 20-25 节：Nuxt 应用插件（Nuxt Plugins）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 25 节
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节。

---

## 1. 概述

上一节讲了**服务端**插件（Nitro plugins）。这一节讲**应用端**插件（Nuxt plugins）——扩展 Nuxt 默认功能的方式，在应用启动前把自定义内容注入入口。

核心点：
- 位置：**应用插件目录**（课程根目录 `plugins/`，**Nuxt 4 是 `app/plugins/`**），与 `server/plugins/` 区分。
- 目录内文件**自动扫描、自动注册**，无需在 `nuxt.config.ts` 声明。
- 用全局函数 **`defineNuxtPlugin`** 定义，参数 `nuxtApp` 是 Nuxt 核心对象（Runtime Core）。
- 三大用途：**生命周期钩子** / **操作 vueApp 实例** / **扩展 NuxtApp（provide）**。

> ⚠️ Nuxt 4 差异（先记住）
> 应用插件目录在 Nuxt 4 是 **`app/plugins/`**（课程在项目根 `plugins/`）。`defineNitroPlugin`（服务端）vs `defineNuxtPlugin`（应用端）别用混。`defineNuxtPlugin` / `useNuxtApp` 用法不变。

---

## 2. 核心知识点 + 演示复盘

### 2.1 第一个 Nuxt 插件

在应用插件目录建文件即自动注册：

```ts
// 课程：plugins/test.ts ｜ 我的项目：app/plugins/test.ts
export default defineNuxtPlugin((nuxtApp) => {
  // nuxtApp 是 Nuxt 核心对象（Runtime Core）
  // 应用渲染时创建的共享变量，保存各种全局信息
  // 例：nuxtApp.vueApp（Vue 实例）、nuxtApp.hooks（运行时钩子）
  console.log(nuxtApp)
})
```

> ⚠️ Nuxt 4 差异：目录是 `app/plugins/`；`defineNuxtPlugin` 用法不变。服务端插件那个叫 `defineNitroPlugin`，别混。

### 2.2 用途一：生命周期钩子

`nuxtApp.hooks.hook(lifecycle, fn)` 订阅应用生命周期。生命周期分两类环境：**Server + Client 都运行** 与 **仅 Client 运行**。

```ts
// app/plugins/test.ts
export default defineNuxtPlugin((nuxtApp) => {
  // app:created —— Vue 应用创建时，服务端 + 客户端都会运行
  nuxtApp.hooks.hook('app:created', () => {
    console.log('vue app created')
  })

  // app:mounted —— 仅客户端（浏览器挂载后）运行
  nuxtApp.hooks.hook('app:mounted', () => {
    console.log('vue app mounted')
  })
})
```

验证：`vue app created` 在终端（SSR）和浏览器都出现；`vue app mounted` 只在浏览器出现——印证两类钩子的执行环境。

> ⚠️ Nuxt 4 差异：`app:created` / `app:mounted` 等生命周期钩子用法不变。

### 2.3 用途二：操作 vueApp 实例

`nuxtApp.vueApp` 就是熟悉的 Vue 实例，可在此注册 Vue 插件、全局组件、全局指令：

```ts
// app/plugins/test.ts
export default defineNuxtPlugin((nuxtApp) => {
  // 注册 Vue 插件
  // nuxtApp.vueApp.use(SomePlugin)

  // 注册全局组件
  // nuxtApp.vueApp.component('MyComponent', MyComponent)

  // 注册全局指令
  // nuxtApp.vueApp.directive('focus', { mounted: (el) => el.focus() })
})
```

> 💡 这是插件最常见的用途之一：接入第三方 Vue 库（如某些 UI 库、图表库）通常就是 `nuxtApp.vueApp.use(...)`。
> ⚠️ Nuxt 4 差异：`nuxtApp.vueApp.use/component/directive` 用法不变。

### 2.4 用途三：扩展 NuxtApp（provide / useNuxtApp）

可以给 NuxtApp 注入全局可用的属性/方法，处处可取。用 `nuxtApp.provide(key, value)`：

```ts
// app/plugins/test.ts
export default defineNuxtPlugin((nuxtApp) => {
  const user = { name: 'viking' }
  // provide(key, value)：注入全局属性
  nuxtApp.provide('author', user)
})
```

任意位置用 **`useNuxtApp()`** 取，注意**注入的属性名前会加 `$` 前缀**（用于区分）：

```vue
<script setup lang="ts">
const nuxtApp = useNuxtApp()
// provide 的 'author' → 通过 $author 访问
console.log(nuxtApp.$author) // { name: 'viking' }
</script>
```

> 💡 也可用对象语法在 `defineNuxtPlugin` 的 `return { provide: { author: user } }` 实现同样效果。
> ⚠️ Nuxt 4 差异：`nuxtApp.provide` / `useNuxtApp().$xxx` 用法不变。

### 2.5 对象语法（补充）

除函数式外，`defineNuxtPlugin` 还支持对象语法，便于声明 `name`、`enforce` 执行时机、内联 `hooks` 等（Nuxt 会静态分析以优化构建）：

```ts
// app/plugins/test.ts
export default defineNuxtPlugin({
  name: 'my-plugin',
  enforce: 'pre', // 'pre' | 'post'，控制相对其他插件的顺序
  async setup(nuxtApp) {
    // 等价于函数式插件体
  },
  hooks: {
    'app:created'() {
      // 直接在这里注册运行时钩子
    },
  },
})
```

> ⚠️ Nuxt 4 差异：对象语法在 Nuxt 4 同样支持，用法不变。

---

## 3. Nitro 插件 vs Nuxt 插件（对比）

| | Nitro 插件（上一节） | Nuxt 插件（本节） |
| --- | --- | --- |
| 目录 | `server/plugins/`（项目根） | **`app/plugins/`**（Nuxt 4） |
| 定义函数 | `defineNitroPlugin` | `defineNuxtPlugin` |
| 参数 | `nitroApp`（后端实例） | `nuxtApp`（应用核心） |
| 运行端 | 服务端 | 服务端 + 客户端（部分钩子仅客户端） |
| 典型用途 | 挂载存储、后端生命周期、初始化后端库 | Vue 插件/组件/指令、provide、应用生命周期 |

---

## 4. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3） | 我的项目（Nuxt 4.4.7） |
| --- | --- | --- |
| 应用插件目录 | `plugins/`（项目根） | **`app/plugins/`** |
| 自动注册 | 是 | 不变 |
| `defineNuxtPlugin` | 支持 | 不变 |
| 生命周期钩子（`app:created`/`app:mounted`） | 支持 | 不变 |
| `nuxtApp.vueApp.use/component/directive` | 支持 | 不变 |
| `nuxtApp.provide` / `useNuxtApp().$x` | 支持 | 不变 |
| 对象语法 | 支持 | 不变 |

> 结论：Nuxt 应用插件的所有 API 在 Nuxt 4 都不变，**唯一差异是目录 `plugins/` → `app/plugins/`**。

---

## 5. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。注意应用插件放 **`app/plugins/`**（不是 `server/plugins/`，也不是根 `plugins/`）。

1. 新建 `app/plugins/test.ts`，`defineNuxtPlugin` 打印 `nuxtApp`，重启观察（2.1）。
2. 加 `app:created` / `app:mounted` 钩子，对比终端（SSR）与浏览器输出差异（2.2）。
3. 用 `nuxtApp.provide('author', { name: 'viking' })` 注入，在 `app/app.vue` 用 `useNuxtApp().$author` 取出打印（2.4）。
4. （可选）尝试对象语法 `defineNuxtPlugin({ name, setup, hooks })`（2.5）。

```bash
npm run dev
```

> 💡 新建 `app/plugins/` 后需重启 dev server。

---

## 6. 易错点 + 关键 API 速查

### 易错点

- **目录别放错**：应用插件 `app/plugins/`（Nuxt 4）；服务端插件 `server/plugins/`。
- **函数别用混**：`defineNuxtPlugin`（应用）vs `defineNitroPlugin`（服务端）。
- **provide 取值加 `$`**：`provide('author', ...)` → `useNuxtApp().$author`。
- **`app:mounted` 只在客户端**：依赖浏览器环境的逻辑放这里，别期望它在 SSR 运行。
- **自动注册**：插件无需在 `nuxt.config.ts` 手动声明（除非放子目录）。
- **新建 `app/plugins/` 后重启**。

### 关键 API / 概念速查

| 名称 | 作用 | 备注 |
| --- | --- | --- |
| `app/plugins/`（课程 `plugins/`） | 应用插件目录 | 自动注册 |
| `defineNuxtPlugin(fn / obj)` | 定义应用插件 | 参数 `nuxtApp` |
| `nuxtApp.hooks.hook(name, fn)` | 应用生命周期 | `app:created`（双端）/`app:mounted`（客户端） |
| `nuxtApp.vueApp` | Vue 实例 | `.use` / `.component` / `.directive` |
| `nuxtApp.provide(key, value)` | 注入全局属性 | 取值加 `$` 前缀 |
| `useNuxtApp()` | 取应用核心对象 | `.$author` 等 |

---

> 小结：①`app/plugins/`（Nuxt 4）下的应用插件用 `defineNuxtPlugin` 定义，参数 `nuxtApp`；②三大用途：生命周期钩子（`app:created` 双端 / `app:mounted` 仅客户端）、操作 `vueApp`（注册插件/组件/指令）、`provide` + `useNuxtApp().$x` 扩展全局；③与服务端 `defineNitroPlugin` 区分；④Nuxt 4 唯一差异是目录 `plugins/` → `app/plugins/`。
