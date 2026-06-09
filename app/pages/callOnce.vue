<script setup lang="ts">
  const dogUrl = useState<string>('dogUrl')
  await callOnce(async () => {
    const dog = await $fetch<{message: string}>('https://dog.ceo/api/breeds/image/random')
    console.log('callOnce 只在服务端运行一次', dog.message)
    dogUrl.value = dog.message
  })
</script>

<template>
  <h1>CallOnce</h1>
  <img :src="dogUrl" alt="cute dogie" width="500">
</template>

<style scoped>

</style>
