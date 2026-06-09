/**
 * 阶段	类型	排序规则
 * 先执行	全局中间件（.global）	按文件名字母序（可用数字前缀干预）
 * 后执行	页面级中间件（命名 + 内联）	按 definePageMeta 里 middleware 数组顺序
 */
export default defineNuxtRouteMiddleware((to, from) => {
  console.log('1 global middleware')
})
