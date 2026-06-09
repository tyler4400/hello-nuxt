<template>
  <div>
    <NuxtRouteAnnouncer />
    <ul>
      <!-- 内部导航：跳转到已定义的内部路由 -->
      <li><NuxtLink to="/">Home</NuxtLink></li>
      <li><NuxtLink to="/login">Login</NuxtLink></li>
      <li><NuxtLink to="/user/123">user123</NuxtLink></li>
      <li><NuxtLink to="/user/forbidden">user-forbidden</NuxtLink></li>
      <li><NuxtLink to="/user/inline-middleware">user-inline-middleware</NuxtLink></li>
      <!-- 外部导航：加 external，会渲染成普通 <a> 标签 -->
      <li><NuxtLink to="https://nuxt.com" external>Nuxt Docs➡️</NuxtLink></li>
    </ul>
    <NuxtPage />
  </div>
</template>
