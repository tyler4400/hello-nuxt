<script setup lang="ts">
  import type { UserData } from "~/types/user";

  const getRandomNumber = () => Math.floor(Math.random() * 10)

  const id = useState('user-id', getRandomNumber)
  const { data, pending, status, error, refresh, clear } = await useFetch<UserData>(() => `https://jsonplaceholder.typicode.com/users/${id.value}`)
  /**
   * 不能在URL中掺咋随机数
   * URL 里的随机 id 让两端 key 对不上,client 复用失败 → 退化成重新请求 → 导致水合失败 Hydration (text content) mismatch
   */
  // const { data, pending, status, error, refresh, clear } = await useFetch<UserData>(() => `https://jsonplaceholder.typicode.com/users/${Math.floor(Math.random() * 10)}`)
</script>

<template>
  <div>
    <button @click="() => refresh()">refresh data</button>
    <button @click="() => clear()">clear data</button>
    <button @click="() => id = getRandomNumber()">change user</button>
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

<style scoped>

</style>
