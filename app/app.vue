<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />
    <ul>
      <!-- 内部导航：跳转到已定义的内部路由 -->
      <li><NuxtLink to="/">Home</NuxtLink></li>
      <li v-if="!currentUser.isLoggedIn"><NuxtLink to="/login">Login</NuxtLink></li>
      <li><NuxtLink to="https://nuxt.com" external>Nuxt Docs ➡️</NuxtLink></li>
      <li><NuxtLink to="/user/123">user123</NuxtLink></li>
      <li><NuxtLink to="/user/forbidden">user-forbidden</NuxtLink></li>
      <li><NuxtLink to="/user/inline-middleware">user-inline-middleware</NuxtLink></li>
      <li><NuxtLink to="/callOnce">callOnce</NuxtLink></li>
      <li><NuxtLink to="/dataFetch">useFetch</NuxtLink></li>
      <li><NuxtLink to="/post/1">useNuxtData post1</NuxtLink></li>
      <li><NuxtLink to="/post/2">useNuxtData post2</NuxtLink></li>
      <li><NuxtLink to="/post2/1">useAsyncData post2-1</NuxtLink></li>
      <li><NuxtLink to="/post2/2">useAsyncData post2-2</NuxtLink></li>
      <!-- 外部导航：加 external，会渲染成普通 <a> 标签 -->
    </ul>
    <div>当前登录用户: {{currentUser.userName || '无'}}</div>
    <NuxtPage />
  </div>
</template>

<script setup lang="ts">
const currentUser = useCurrentUser()

</script>
