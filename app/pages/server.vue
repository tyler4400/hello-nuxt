<script setup lang="ts">
const data = ref()
const handleSend = async () => {
  const _data = await $fetch('/api/body', {
    method: 'POST',
    body: { name: 'rose' }
  })
  data.value = _data
}
</script>

<template>
  <h1>server</h1>
  <button @click="handleSend">send</button>
  <pre>{{data}}</pre>
</template>

<style scoped>

</style>
