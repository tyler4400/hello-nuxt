// 把原来的 defineEventHandler 换成 defineAuthResponseHandler 即可（server/utils/ 自动导入，无需 import）
export default defineAuthResponseHandler((event) => {
  return '准许访问'
})
