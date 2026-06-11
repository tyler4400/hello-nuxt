<template>
  <h1>环境配置</h1>
  <ul>
    <li>runtimeConfig	私密/运行时配置（token、密钥）	✅ 支持覆盖	运行时 	仅 public 下可读</li>
    <li>app.config	  公开的应用配置（主题、标题）	    ❌ 不支持	  构建时  	✅ 可读，且支持 HMR</li>
  </ul>
  <div>config:</div>
  <pre>{{ config }}</pre>
</template>
<script setup lang="ts">
const config = useRuntimeConfig()
console.log(config.apiKey) // ❗前端是 undefined：顶层 runtimeConfig 只在后端可读
</script>
