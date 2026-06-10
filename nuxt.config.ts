// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: [],
  css: ['~/assets/style.css'],
  // app 是对整个应用程序的配置，其下的 head 对应 HTML 的 <head> 标签内容。可在这里全局设置第三方 CSS、字符编码、标题、meta 等。
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
})
