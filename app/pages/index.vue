<script setup lang="ts">
const router = useRouter()

const goLogin = () => {
  // 程序化跳转
  router.push('/login')
}
</script>
<template>
  <h1>home page</h1>
  <button @click="goLogin">去登录</button>
  <button @click="navigateTo('/user/abc')">去user/abc(未登录会被重定向)</button>

  <Helloworld message="Hello World" />
</template>
