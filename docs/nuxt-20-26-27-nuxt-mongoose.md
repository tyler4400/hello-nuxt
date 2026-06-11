# 第 20-26 / 20-27 节：Modules 与 nuxt-mongoose（数据库集成）

> 课程：慕课实战《真实高质量低代码商业项目》第 20 章 · 第 26 节 + 第 27 节（合并）
> 本文基于课程视频（Nuxt 3）整理，并以本地 Nuxt 4 项目 **`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`** 为准标注差异。
> 项目实测版本/结构见 `nuxt-20-05-auto-imports.md` 第 0 节。
> ⚠️ 本篇涉及第三方模块 **`nuxt-mongoose`**，其 API 随版本演进，已对照 **v1.1.2（兼容 Nuxt 4）** 标注与课程的差异。

---

## 1. 概述

前两节讲了插件，这两节讲比插件更大的概念——**Modules（模块）**，并用 **`nuxt-mongoose`** 模块接入 MongoDB 数据库。

主线：
- **第 26 节**：理解 Modules 概念与优点；从 Nuxt 模块市场安装 `nuxt-mongoose`，配置连接 MongoDB，用 `.env` 管理连接串。
- **第 27 节**：用 `nuxt-mongoose` 自动加载 `server/models/` 下的模型，用 `defineMongooseModel` 定义 User 模型，完成一次查询。

> ⚠️ Nuxt 4 / 版本差异（先记住，详见正文）
> - `modules` 数组、Modules 概念：**不变**。
> - `nuxt-mongoose` 当前 **v1.1.2 兼容 Nuxt 4**，但相比课程有两处实操差异：① 连接串环境变量从课程的 `MONGODB_URI` 改为 **`NUXT_MONGOOSE_URI`**；② `defineMongooseModel` 现在文档推荐 **显式 `import ... from '#nuxt/mongoose'`**（课程说自动导入直接用）。
> - `server/models/` 仍在项目根 `server/` 下。

---

## 2. 核心知识点（第 26 节：Modules 概念）

### 2.1 什么是 Modules

Modules 是 Nuxt 的关键特性之一：用**预制的、独立的插件包**来扩展和定制整个 Nuxt 应用。可理解为“**比插件更大的概念，一个模块可以包含插件**”，是把功能组织封装、便于复用维护的方式。

官方有模块市场（类似 Nuxt 的 App Store），常见模块如 Tailwind、ESLint、各类数据库/UI 库都能找到。

### 2.2 Modules 的优点

1. **简化开发**：把常用功能封装成模块，减少重复代码与配置，开箱即用。
2. **一致的项目流程**：通用功能标准化，团队协作/共享更轻松。
3. **强大的生态**：从自动化部署到国际化，一键配置引入。

### 2.3 一个 Module 能扩展什么

| 端 | 可扩展 |
| --- | --- |
| **App 端** | 全局组件 Components、组合式函数 Composables、Nuxt Plugins |
| **Server 端** | 自动注册 API 路由、Middleware、Server Plugins、静态文件（样式/图片/3D 模型等） |

> 💡 编写模块本节不深入，会用即可：需要功能时先去模块市场搜，有现成的就直接装。

---

## 3. 核心知识点 + 演示复盘（第 26 节：安装 nuxt-mongoose）

### 3.1 安装与注册

在模块市场搜 mongoose 找到 `nuxt-mongoose`，安装：

```bash
# 课程做法（依然可用）
npm install nuxt-mongoose

# Nuxt 现代推荐做法（自动写入 modules）
npx nuxi@latest module add nuxt-mongoose
```

在 `nuxt.config.ts` 的 `modules` 数组注册：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // 每个模块是数组中的一项
  modules: ['nuxt-mongoose'],
})
```

> ⚠️ Nuxt 4 差异：`modules` 数组用法不变；推荐用 `npx nuxi module add` 安装（会自动登记到 `modules`）。

### 3.2 配置 MongoDB 连接

`nuxt-mongoose` 的配置放在 `nuxt.config.ts` 的 `mongoose` 选项里，最关键的是连接地址 `uri`（确保本地 Mongo 已启动）：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-mongoose'],
  mongoose: {
    uri: 'mongodb://localhost:27017/your-db',
    options: {},
    modelsDir: 'models', // 模型目录，默认 server/models
  },
})
```

配置正确后，终端会输出 `connected to mongodb`，说明连接成功。

### 3.3 用 `.env` 管理连接串（更安全）

连接串可能含密码等敏感信息，应放 `.env`。`nuxt-mongoose` 提供环境变量自动替换：

```bash
# .env
# ⚠️ 当前版本（v1.1.2）使用 NUXT_MONGOOSE_URI
NUXT_MONGOOSE_URI=mongodb://localhost:27017/your-db
```

提供该环境变量后，`nuxt.config.ts` 里的 `mongoose.uri`（甚至整个 `mongoose` 对象）都可以省略——模块会自动读取 `NUXT_MONGOOSE_URI` 连接。

> ⚠️ 重要版本差异：**课程视频里用的环境变量名是 `MONGODB_URI`**（当时文档如此）。当前 `nuxt-mongoose` **已改用 `NUXT_MONGOOSE_URI`**（符合 Nuxt runtimeConfig 的 `NUXT_` 命名约定）。请以 `NUXT_MONGOOSE_URI` 为准。

---

## 4. 核心知识点 + 演示复盘（第 27 节：定义模型与查询）

### 4.1 自动加载模型目录

`nuxt-mongoose` 会**自动加载 `server/models/` 下的所有模型文件**（默认目录，可用 `modelsDir` 改）。所以模型放 `server/models/` 即可。

> ⚠️ Nuxt 4 差异：`server/models/` 在项目根 `server/` 下（不进 `app/`），不变。

### 4.2 用 `defineMongooseModel` 定义模型

`nuxt-mongoose` 提供 `defineMongooseModel` 定义模型，支持泛型（定义字段时有自动补全 + 类型校验）：

```ts
// server/models/user.ts
// ⚠️ 当前版本推荐显式导入；课程时代说它自动导入、可直接用
import { defineMongooseModel } from '#nuxt/mongoose'

// 用户字段接口（可从已有代码复用）
interface IUser {
  userName: string
  nickName?: string
  email: string
}

// 具名导出：第一参=模型名，第二参=schema，第三参=options
export const UserSchema = defineMongooseModel<IUser>(
  'User',
  {
    userName: { type: String, unique: true, required: true },
    nickName: { type: String },
    email: { type: String, required: true },
  },
  {
    // 第三参 options（与原生 mongoose 一致）
    timestamps: true, // 自动加 createdAt / updatedAt
    toJSON: {
      // 转 JSON 时可删除敏感字段等
      transform(doc, ret) {
        // delete ret.__v
        return ret
      },
    },
  }
)
```

要点：
- **类型在运行时自动生成**：从 `#nuxt/mongoose` 导入的类型需**先把应用跑起来**才会生成，否则报错——先 `npm run dev` 再写。
- **泛型 `<IUser>`**：定义字段时自动补全、类型不对会报错（如 `type` 只能是合法类型）。
- **两种签名**：除上面的 `('User', schema, options)`，也支持对象式 `defineMongooseModel({ name, schema, options })`。

> ⚠️ 版本差异：
> - **导入方式**：课程说 `defineMongooseModel` 自动注册、可直接用；当前 v1.1.2 文档示例统一用 `import { defineMongooseModel } from '#nuxt/mongoose'`。建议照当前文档显式导入更稳。
> - 这套 schema/options 用法源自原生 Mongoose，若遗忘可回看后端课程的用户数据模型章节。

### 4.3 完成一次查询

模型会注册到全局，在 server 路由里用它查询（这里具名导出的 `UserSchema` 直接用）：

```ts
// server/api/users/index.ts  →  GET /api/users
export default defineEventHandler(async (event) => {
  const users = await UserSchema
    .find()                          // 查询全部
    .select('userName nickName')     // 只取这两个字段
    .limit(10)                       // 限制 10 条
    .lean()                          // 返回普通 JSON 对象（更轻量）

  return users
})
```

访问 `/api/users`，即返回只含 `userName` / `nickName` 的用户列表。至此 Mongoose 集成跑通。

> ⚠️ Nuxt 4 差异：Mongoose 查询链（`find`/`select`/`limit`/`lean`）是原生 Mongoose API，不受 Nuxt 版本影响。

---

## 5. Nuxt 4 / 版本适配总览（课程 → 我的 hello-nuxt）

| 维度 | 课程（Nuxt 3 时代） | 我的项目（Nuxt 4 + nuxt-mongoose v1.1.2） |
| --- | --- | --- |
| `modules` 数组 / Modules 概念 | 支持 | 不变 |
| 安装方式 | `npm install nuxt-mongoose` | 同样可用；推荐 `npx nuxi module add nuxt-mongoose` |
| 连接串环境变量 | `MONGODB_URI` | **`NUXT_MONGOOSE_URI`** |
| `mongoose` 配置项 | `uri` / `options` / `modelsDir` | 不变 |
| 模型目录 | `server/models/` | `server/models/`（项目根，不变） |
| `defineMongooseModel` | 课程说自动导入直接用 | 推荐 **`import { defineMongooseModel } from '#nuxt/mongoose'`** |
| 模型签名 | `('User', schema, options)` | 不变；也支持对象式 `{ name, schema, options }` |
| 查询 API | 原生 Mongoose | 不变 |

> 结论：Modules 机制本身 Nuxt 4 不变；`nuxt-mongoose` v1.1.2 已兼容 Nuxt 4，主要差异是**环境变量名 `NUXT_MONGOOSE_URI`** 与 **`defineMongooseModel` 显式导入**两处实操点。

---

## 6. 在我的 hello-nuxt 项目中动手复刻

> 项目根目录：`/Users/tylerzzheng/Code/Nuxt/hello-nuxt`。前置：本地 MongoDB 已启动（默认 27017）。

1. 安装并注册模块：

```bash
npx nuxi@latest module add nuxt-mongoose
```

   （或 `npm install nuxt-mongoose` 后手动加入 `modules: ['nuxt-mongoose']`。）

2. 配置连接：在 `.env` 写 `NUXT_MONGOOSE_URI=mongodb://localhost:27017/hello-nuxt`（省略 `nuxt.config.ts` 的 `mongoose` 也可）。
3. 启动并确认终端出现 `connected to mongodb`：

```bash
npm run dev
```

4. 新建 `server/models/user.ts`，用 `import { defineMongooseModel } from '#nuxt/mongoose'` + 泛型定义 `UserSchema`（4.2）。
5. 新建 `server/api/users/index.ts`，用 `UserSchema.find().select(...).limit(10).lean()` 查询并返回（4.3）。
6. 访问 `http://localhost:3000/api/users` 验证返回数据。

> 💡 类型未生成导致 import 报错时，先确保 `npm run dev` 在运行（类型是运行时自动生成的）。

---

## 7. 易错点 + 关键 API 速查

### 易错点

- **环境变量用 `NUXT_MONGOOSE_URI`**（当前版本），不是课程的 `MONGODB_URI`。
- **`defineMongooseModel` 显式导入**：`import { defineMongooseModel } from '#nuxt/mongoose'`，当前文档推荐。
- **类型需先运行项目生成**：没跑 `npm run dev` 就从 `#nuxt/mongoose` 导入会报错。
- **模型放 `server/models/`**（项目根 server 下），默认目录；改位置用 `modelsDir`。
- **连 MongoDB 前先启动 Mongo**：否则连接失败、无 `connected to mongodb`。
- **`.lean()` 返回普通对象**：比 Mongoose 文档实例更轻量，适合只读返回。
- **`#nuxt/mongoose` 是模块虚拟别名**：只在装了 `nuxt-mongoose` 后可用。

### 关键 API / 概念速查

| 名称 | 作用 | 备注 |
| --- | --- | --- |
| `modules: [...]` | 注册 Nuxt 模块 | nuxt.config |
| `nuxt-mongoose` | MongoDB/Mongoose 集成模块 | v1.1.2 兼容 Nuxt 4 |
| `mongoose: { uri, options, modelsDir }` | 模块配置 | `uri` 可由 `.env` 提供 |
| `NUXT_MONGOOSE_URI` | 连接串环境变量 | 课程为 `MONGODB_URI` |
| `defineMongooseModel(name, schema, options)` | 定义模型 | `import ... from '#nuxt/mongoose'` |
| `server/models/` | 模型目录 | 自动加载，项目根 |
| `.find().select().limit().lean()` | 查询链 | 原生 Mongoose |

---

> 小结：①Modules 是比插件更大的封装单位，可扩展 App/Server 各方面，从模块市场一键引入；②`nuxt-mongoose` 接入 MongoDB：`modules` 注册 + `NUXT_MONGOOSE_URI` 连接 + `server/models/` 自动加载；③用 `defineMongooseModel`（显式从 `#nuxt/mongoose` 导入）定义模型并查询；④版本差异重点：环境变量名改为 `NUXT_MONGOOSE_URI`、`defineMongooseModel` 显式导入。
