<script setup lang="ts">
import type { PostData } from '~/types/user'

const route = useRoute()
// 把 id 单独取出，多处复用 ( Nuxt 故意的设计：让「同一动态路由、不同参数」默认重新跑 setup, 所以这里不用watch
const id = computed(() => route.params.id)

const { pending, data, status, error, refresh, clear } = await useAsyncData<PostData>(
    // key 用 getter：参数变化时自动切换缓存 key（每个 id 一份）
    () => `posts/${id.value}`,
    // handler：真正的请求逻辑
    () => $fetch(`https://jsonplaceholder.typicode.com/posts/${id.value}`),
    {
      // 自定义 getCachedData 一举两得：
      // 1) 命中 payload/static 缓存就直接复用，不再发请求
      // 2) 因为“提供了自定义 getCachedData”，Nuxt 会跳过 purgeCachedData 的卸载清理，缓存得以常驻
      getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key],
    }
)

</script>

<template>
  <div>
    <button @click="() => refresh()">refresh data</button>
    <button @click="() => clear()">clear data</button>
    <div>pending: {{ pending }}</div>
    <div>status: {{ status }}</div>

    <!-- data 可能为空，用 v-if 做 type guard -->

    <div>
      <h3>data: </h3>
      <pre>{{ data }}</pre>
    </div>

    <div>
      <h3>error: </h3>
      <pre>{{ error }}</pre>
    </div>

  </div>
</template>
