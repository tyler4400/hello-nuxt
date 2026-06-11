export default defineEventHandler((event) => {
  // getRequestURL 是 H3 内置全局函数，取本次请求 URL
  console.log('new request', getRequestURL(event).href)
})
