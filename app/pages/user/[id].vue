<template>
  <h1>user detail page</h1>
  <div>{{ route.params.id }}</div>
</template>

<script lang="ts" setup>
const route = useRoute()

definePageMeta({
  // middleware 是数组，可挂多个；名称对应中间件文件名
  middleware: [
    // 内联中间件：访问 id 为 '2' 的用户时，直接跳回首页
    (to, from) => {
      // ⚠️ params.id 是 string 类型，必须写字符串 '2'，不能写数字 2
      if (to.params.id === 'inline-middleware') {
        console.log('middleware abortNavigation')
       return abortNavigation()
      }
    },
      'auth'
  ],
})
</script>
