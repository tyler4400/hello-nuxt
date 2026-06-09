<template>
  <h1>login</h1>
  <button @click="handleLogin">Login</button>
</template>
<script setup lang="ts">
const currentUser = useCurrentUser()

// 点击登录：写入状态并跳首页
const handleLogin = () => {
  currentUser.value.isLoggedIn = true
  currentUser.value.userName = 'tyler'
  navigateTo('/')
}
</script>
