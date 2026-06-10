<script setup lang="ts">
import type { PostData } from '~/types/user'

/**
 * ⚠️注意 以下写法在nuxt3可以，在nuxt4不行
 * Nuxt 4 默认开启了 experimental.purgeCachedData: true——组件卸载后会自动清掉它用 useAsyncData 拉到的缓存（防内存泄漏）
 * 除非nuxt.config.ts 里设 experimental.purgeCachedData: false，回退跟nuxt3一致
 * 或者使用getCachedData，参见pages/post2/[id].vue
 *
 *  ❓为什么来回切是「卸载重建」而不是复用
 *  vue Router 对「同一路由组件、只有 params 变化」的导航，默认是复用实例的。但 Nuxt 的 <NuxtPage> 主动改掉了这个默认行为——它给页面组件套了一个基于路由的 key
 *  所以 /post/1 → /post/2 时 key 从 /post/1 变成 /post/2，key 变了 Vue 就会销毁旧组件、创建新组件，于是触发 onScopeDispose → _off() → purge 清缓存。
 *  这是 Nuxt 故意的设计：让「同一动态路由、不同参数」默认重新跑 setup、重新取数（大多数场景下切到 /post/2 就是想看到新数据）。代价就是不复用、卸载会触发缓存清理。
 */
const route = useRoute()
// 把 id 单独取出，多处复用 ( Nuxt 故意的设计：让「同一动态路由、不同参数」默认重新跑 setup, 所以这里不用watch
const id = route.params.id

// 缓存 key 带上 id，做到“每个用户一份缓存”
const { data: cachedUser } = useNuxtData<PostData>(`posts/${id}`)

// data 作为最终展示用的数据
const data = ref<PostData>()

if (cachedUser.value) {
  // 命中缓存：直接赋值，不发请求
  data.value = cachedUser.value
} else {
  // 未命中：发请求，并以同样的 key 写入缓存
  const { data: fetchedUser } = await useAsyncData<PostData>(`posts/${id}`, () => {
    return $fetch(`https://jsonplaceholder.typicode.com/posts/${id}`)
  })
  data.value = fetchedUser.value
}
</script>

<template>
  <div>
    <h3>post data: </h3>
    <pre>{{ data }}</pre>
  </div>
</template>
