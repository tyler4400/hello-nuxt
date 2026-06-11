export default defineNuxtPlugin(nuxtApp => {
  // 2.2 用途一：生命周期钩子
  // https://nuxt.com/docs/4.x/api/advanced/hooks
  // app:created —— Vue 应用创建时，服务端 + 客户端都会运行
  nuxtApp.hooks.hook('app:created', () => {
    console.log('vue app created')
  })

  // app:mounted —— 仅客户端（浏览器挂载后）运行
  nuxtApp.hooks.hook('app:mounted', () => {
    console.log('vue app mounted')
  })

  // 2.3 用途二：操作 vueApp 实例
  // nuxtApp.vueApp 就是熟悉的 Vue 实例，可在此注册 Vue 插件、全局组件、全局指令：
  // 注册 Vue 插件
  // nuxtApp.vueApp.use(SomePlugin)

  // 注册全局组件
  // nuxtApp.vueApp.component('MyComponent', MyComponent)

  // 注册全局指令
  // nuxtApp.vueApp.directive('focus', { mounted: (el) => el.focus() })

  /**
   * 2.4 用途三：扩展 NuxtApp（provide / useNuxtApp）
   * 可以给 NuxtApp 注入全局可用的属性/方法，处处可取。用 nuxtApp.provide(key, value)
   *
   * 任意位置用 useNuxtApp() 取，注意注入的属性名前会加 $ 前缀（用于区分）：
   * const nuxtApp = useNuxtApp()
   * // provide 的 'author' → 通过 $author 访问
   * console.log(nuxtApp.$author) // { name: 'jack' }
   */
  const user = { name: 'jack' }
  // provide(key, value)：注入全局属性
  nuxtApp.provide('author', user)
})


// 除函数式外，defineNuxtPlugin 还支持对象语法，便于声明 name、enforce 执行时机、内联 hooks 等（Nuxt 会静态分析以优化构建）
// export default defineNuxtPlugin({
//   name: 'my-plugin',
//   enforce: 'pre', // 'pre' | 'post'，控制相对其他插件的顺序
//   async setup(nuxtApp) {
//     // 等价于函数式插件体
//   },
//   hooks: {
//     'app:created'() {
//       // 直接在这里注册运行时钩子
//     },
//   },
// })
