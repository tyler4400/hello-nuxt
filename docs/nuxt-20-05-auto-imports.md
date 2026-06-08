# ++

#  第 20-5 节：自动导入（Auto Imports）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 5 节
> 本文基于课程视频（Nuxt 3）整理，并以我本地的 Nuxt 4 项目 `**/Users/tylerzzheng/Code/Nuxt/hello-nuxt**`（`npm create nuxt` 生成）为准标注差异。
> 凡是出现 `> ⚠️ Nuxt 4 差异` 的引用块，都是讲师演示（Nuxt 3）与我的 Nuxt 4 项目不一致、需要改写的地方。

---

## 0. 我的 Nuxt 4 项目实测信息（三篇文档共用基准）

`hello-nuxt` 由 `npm create nuxt` 生成，实测依赖版本：


| 依赖                    | 版本        | 备注                                                                                |
| --------------------- | --------- | --------------------------------------------------------------------------------- |
| `nuxt`                | `4.4.7`   | 课程是 Nuxt 3                                                                        |
| `vue`                 | `3.5.35`  | 一致                                                                                |
| `vue-router`          | `5.1.0`   | **课程时代是 vue-router 4**，但 `useRoute` / `useRouter` / `<NuxtLink>` / 导航守卫签名对使用者基本一致 |
| `vite`                | `8.0.16`  | 构建工具                                                                              |
| `nitropack`           | `2.13.4`  | 服务端引擎                                                                             |
| `@nuxtjs/tailwindcss` | `^6.14.0` | 课程未用，复刻时可选用它做样式                                                                   |


初始目录结构（关键部分）：

```text
hello-nuxt/
├─ app/              # ← Nuxt 4 应用代码主目录（srcDir）
│  └─ app.vue        # 入口组件（目前只有这一个文件）
├─ public/           # 静态资源（favicon.ico、robots.txt）
├─ nuxt.config.ts    # 配置（在根目录）
├─ tsconfig.json     # 引用 .nuxt 下 4 个子 TS 工程（app/server/shared/node）
└─ package.json
```

初始 `app/app.vue` 的真实内容：

```vue
<!-- app/app.vue（npm create nuxt 默认模板） -->
<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>
```

> 💡 课程里这些文件都在**项目根目录**；我的项目里它们在 `**app/`** 下。这是本章最核心、最高频的差异，后面所有节都适用。

---

## 1. 概述

上一节我们生成了 Nuxt 的基础模板、了解了文件结构并选好了插件。从这一节起正式进入编码，第一个要掌握的核心特性就是 **Auto Imports（自动导入）**。

一句话概括：**只要把特定文件放进 Nuxt 约定的文件夹，Nuxt 会自动把它们导入到项目里，省去手写 `import` 的麻烦。**

这一节会做两个 demo：

- 在 `components/` 里写一个 `HelloWorld` 组件并直接使用（验证组件自动导入 + Vue API 自动导入）。
- 在 `composables/` 里写一个 `useKeyPress` Hook 并直接使用（验证 composable 自动导入 + 类型生成机制）。

---

## 2. 核心知识点 + 演示复盘

### 2.1 自动导入的三大类

Nuxt 的自动导入能力覆盖三部分：


| 类别              | 说明                    | 例子                                              |
| --------------- | --------------------- | ----------------------------------------------- |
| **Vue.js API**  | Vue 提供的响应式/生命周期 API   | `ref`、`reactive`、`computed`、`onMounted`、`watch` |
| **约定文件夹内容**     | 放进特定文件夹的文件            | `components/`、`composables/`、`utils/`           |
| **Nuxt 内置全局函数** | Nuxt 提供的大量 composable | `useFetch`、`useRoute`、`useState`                |


这三类都**不需要手写 `import`**，直接用即可，不会报错。

> ⚠️ Nuxt 4 差异（文件夹位置）
> 课程里这三个文件夹在**项目根目录**（`components/`、`composables/`、`utils/`）。
> 我的 Nuxt 4 项目把应用代码放到 `app/` 子目录下，所以对应路径是：
> `app/components/`、`app/composables/`、`app/utils/`。
> 机制完全一样，只是**多套一层 `app/`**。详见第 3 节对照表。

### 2.2 Demo 一：组件自动导入（`components/`）

#### 步骤 1：创建组件

新建组件文件（注意文件夹拼写，Nuxt 是“强约定”框架，拼错就不生效）。

```vue
<!-- 课程（Nuxt 3）：components/HelloWorld.vue -->
<!-- 我的项目（Nuxt 4）：app/components/HelloWorld.vue（内容完全相同） -->
<template>
  <div>
    <!-- 同时输出 props 传入的 message 和内部 counter -->
    <h1>{{ message }} - {{ counter }}</h1>
    <button @click="counter++">Increase</button>
  </div>
</template>

<script setup lang="ts">
// 注意：这里直接用 ref，不需要 import { ref } from 'vue'
// 这就是「Vue.js API 自动导入」
const counter = ref(0)

// 定义一个 message 属性，类型为 string
defineProps<{
  message: string
}>()
</script>
```

要点：

- `ref` 没有任何 `import` 也能用 —— **Vue API 自动导入**生效。
- `defineProps` 定义了一个 `message: string` 属性。

#### 步骤 2：在入口使用组件

打开入口文件，把内置的 `<NuxtWelcome />` 换成我们的 `<HelloWorld />`，直接写标签即可（**不需要 import 组件**），编辑器还会自动提示缺少 `message` 属性。

```vue
<!-- 课程（Nuxt 3）：app.vue -->
<!-- 我的项目（Nuxt 4）：app/app.vue -->
<template>
  <div>
    <!-- 保留默认的 NuxtRouteAnnouncer，把 NuxtWelcome 换成 HelloWorld -->
    <NuxtRouteAnnouncer />
    <!-- 直接使用 HelloWorld，无需 import；message 为必填属性 -->
    <HelloWorld message="Wiki" />
  </div>
</template>
```

运行后页面显示 `Wiki - 0`，点击按钮 counter 自增，说明组件自动导入与交互都正常。

> ⚠️ Nuxt 4 差异（入口文件位置与默认内容）
> 课程的入口文件是根目录 `app.vue`，里面只有一个 `<NuxtWelcome />`。
> 我的项目入口是 `app/app.vue`，默认模板是 `<div>` 包着 `<NuxtRouteAnnouncer />` + `<NuxtWelcome />`（见第 0 节）。
> 复刻时**保留 `<NuxtRouteAnnouncer />`**（无障碍路由播报组件，不影响功能），只把 `<NuxtWelcome />` 替换成 `<HelloWorld message="Wiki" />` 即可。

### 2.3 Demo 二：Composable 自动导入（`composables/`）

`composables/` 放的就是我们熟悉的 **Hooks 函数**（用到 Vue 响应式特性的一系列函数），Nuxt 换了个名字叫 composable，同样自动导入。

#### 步骤 1：创建 composable

新建 composable，按下指定按键时触发回调。

```ts
// 课程（Nuxt 3）：composables/useKeyPress.ts
// 我的项目（Nuxt 4）：app/composables/useKeyPress.ts（内容完全相同）

// 按下某个 key 时执行 callback
export const useKeyPress = (key: string, cb: () => void) => {
  // 当前按下的键与传入的 key 相同时，执行回调
  const trigger = (event: KeyboardEvent) => {
    if (event.key === key) {
      cb()
    }
  }

  // onMounted / onUnmounted 是 Vue API，自动导入，无需 import
  // 组件挂载时绑定事件
  onMounted(() => {
    document.addEventListener('keydown', trigger)
  })

  // 组件卸载时移除事件，避免内存泄漏
  onUnmounted(() => {
    document.removeEventListener('keydown', trigger)
  })
}
```

要点：

- `onMounted` / `onUnmounted` 又是 Vue API 自动导入，无需 `import`。
- **一定要 `export`**，否则无法被自动导入使用。

#### 步骤 2：在组件里使用

回到 `HelloWorld.vue`，按下 `J` 键时让 counter 自增：

```vue
<script setup lang="ts">
const counter = ref(0)

defineProps<{
  message: string
}>()

// 直接使用 useKeyPress，无需 import
useKeyPress('j', () => {
  counter.value++
})
</script>
```

按下键盘 `J`，counter 自增，功能实现。

#### 关键机制：类型生成 + 新建文件夹要重启

讲师在这里强调了一个**很容易踩的坑**：

- Nuxt 会监控文件系统，自动生成全局类型，写在 `.nuxt/imports.d.ts` 里（这个目录里的文件不用手动管）。
- 但**第一次新建** `composables/` 文件夹时，它还没被纳入监控，会出现 `useKeyPress` 报红 / 无自动补全。
- **解决办法：重启 dev server**。重启后该文件夹被纳入监控，之后再往里加多少文件都会自动生成类型，一劳永逸。

> ⚠️ Nuxt 4 差异（机制不变，只是路径与类型工程更细）
> 类型文件依旧生成在 `.nuxt/imports.d.ts`；“新建文件夹要重启 dev server”这条在 Nuxt 4 同样成立。
> 区别一：被扫描的目录变成 `app/composables/`、`app/utils/`。
> 区别二：我的项目 `tsconfig.json` 引用了 `.nuxt` 下 **4 个独立 TS 工程**（app / server / shared / node），这是 Nuxt 4 的 TypeScript 上下文分离特性，让客户端/服务端类型互不串扰。

---

## 3. Nuxt 4 适配总览（课程 Nuxt 3 → 我的 hello-nuxt）

这一节涉及的所有差异集中如下，核心只有一句：**约定目录整体下移到 `app/`**，API 与机制不变。


| 维度             | 课程（Nuxt 3）           | 我的项目（Nuxt 4.4.7，实测）                                                     |
| -------------- | -------------------- | ----------------------------------------------------------------------- |
| 组件目录           | `components/`        | `app/components/`                                                       |
| Composable 目录  | `composables/`       | `app/composables/`                                                      |
| 工具函数目录         | `utils/`             | `app/utils/`                                                            |
| 入口文件           | `app.vue`            | `app/app.vue`（默认含 `<NuxtRouteAnnouncer />`）                             |
| `srcDir` 默认值   | `.`（项目根）             | `app/`                                                                  |
| `~` / `@` 别名指向 | 项目根目录                | `app/` 目录（`~/components` = `app/components/`）                           |
| 类型生成文件         | `.nuxt/imports.d.ts` | `.nuxt/imports.d.ts`（不变）                                                |
| TS 工程划分        | 单一                   | app / server / shared / node 四个独立工程                                     |
| 自动导入机制         | 三大类自动导入              | 完全一致                                                                    |
| 仍在项目根的目录       | —                    | `nuxt.config.ts`、`server/`、`public/`、`modules/`、`layers/`、`shared/`（新增） |


> 💡 向后兼容提醒：Nuxt 4 如果检测到你**没有** `app/` 目录、而是用了根目录的老结构（如根级 `pages/`），会自动回退到 Nuxt 3 的扫描方式继续工作。所以“两种写法好像都能跑”，但**不要混用**——要么全在 `app/` 下，要么全在根目录。我的 `hello-nuxt` 已经是标准 `app/` 结构，统一用 `app/` 即可。

---

## 4. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`，路径全部按真实的 `app/` 结构给出。

1. 新建组件 `app/components/HelloWorld.vue`，内容用 2.2 步骤 1 的代码。
2. 编辑入口 `app/app.vue`，把 `<NuxtWelcome />` 换成 `<HelloWorld message="Wiki" />`（保留外层 `<div>` 和 `<NuxtRouteAnnouncer />`）。
3. 启动开发服务器（`package.json` 里已定义为 `TMPDIR=/tmp nuxt dev`）：

```bash
npm run dev
```

1. 新建 composable `app/composables/useKeyPress.ts`，内容用 2.3 步骤 1 的代码。
2. **重启 dev server**（因为新建了 `app/composables/` 文件夹）。
3. 在 `HelloWorld.vue` 的 `<script setup>` 里调用 `useKeyPress('j', () => { counter.value++ })`。
4. 打开 `http://localhost:3000`，点击按钮或按 `J` 键，确认 counter 自增。

验证自动导入是否生效的小技巧：去看 `.nuxt/imports.d.ts`，能在里面找到 `useKeyPress` 的声明，就说明已被纳入自动导入。

---

## 5. 易错点 + 关键 API 速查

### 易错点

- **文件夹拼写必须准确**：`components`、`composables`、`utils` 拼错就不会被扫描，且不报错，很难排查。
- **composable 忘记 `export`**：不导出就无法自动导入。
- **新建约定目录后必须重启 dev server**：否则报红 / 无补全。这是“第一次新建该文件夹”时的常见现象，重启后恢复。
- **Nuxt 4 路径别漏 `app/`**：我的项目已是 `app/` 结构，把文件放到根目录 `components/`（而非 `app/components/`）会扫描不到。
- **默认只扫描 composables 顶层**：`app/composables/useFoo.ts` 会被扫描，`app/composables/nested/foo.ts` 默认**不会**。需要嵌套时，要么在 `app/composables/index.ts` 里 re-export，要么在 `nuxt.config.ts` 配置 `imports.dirs`（此点 Nuxt 3 / 4 行为一致，课程未展开）。

### 关键 API / 概念速查


| 名称                                   | 作用              | 是否需 import |
| ------------------------------------ | --------------- | ---------- |
| `ref` / `reactive` / `computed`      | Vue 响应式 API     | 否（自动导入）    |
| `onMounted` / `onUnmounted`          | Vue 生命周期钩子      | 否（自动导入）    |
| `defineProps`                        | 定义组件 props（编译宏） | 否          |
| `components/`（→ `app/components/`）   | 放组件，按名直接使用      | 否          |
| `composables/`（→ `app/composables/`） | 放 Hooks 函数      | 否          |
| `utils/`（→ `app/utils/`）             | 放工具函数           | 否          |
| `.nuxt/imports.d.ts`                 | 自动生成的全局类型声明     | —（不用手动管）   |


---

> 小结：这一节掌握三件事 —— ①Nuxt 三大类自动导入；②`components` / `composables`（+ `utils`）约定目录；③我的 Nuxt 4 项目把它们都挪到了 `app/` 下，但用法一字不差。

