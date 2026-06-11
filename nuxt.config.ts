// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [],
  css: ['~/assets/style.css'],
  // app 是对整个应用程序的配置，代码中使用useRuntimeConfig()获取
  // 其下的 head 对应 HTML 的 <head> 标签内容。可在这里全局设置第三方 CSS、字符编码、标题、meta 等。
  app: {
    // pageTransition: { name: 'page', mode: 'out-in' },
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
      // link: [
      //   { rel: 'stylesheet', href: 'https://cdn.example.com/some.css' },
      // ],
    },
  },
  // Nuxt 用特殊命名约定让 .env 自动覆盖 runtimeConfig，无需手写 process.env
  runtimeConfig: {
    // 默认值，运行时可被环境变量覆盖
    apiKey: '1234',
    public: {
      someUrl: 'https://example.com',
    },
    redis: {
      // 默认空，由 .env 覆盖
      host: '',
      port: 0,
    },
  },
  devServer: {
    port: 3002,
  },
  nitro: {
    storage: {
      // 'redis' 是这个挂载点的名称，自定义
      // redis: {
      //   driver: 'redis',
      //   port: 6379,
      //   host: '127.0.0.1', // localhost
      //   password: '',       // 本地无密码
      //   db: 0,              // 默认 0，可省略
      // },
    },
  },
})
