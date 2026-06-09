<template>
  <div>
    <!-- 同时输出 props 传入的 message 和内部 counter -->
    <div>{{ message }} - {{ counter }}</div>
    <button class="p-2" @click="counter++">Increase</button>
  </div>
</template>

<script setup lang="ts">
// 注意：这里直接用 ref，不需要 import { ref } from 'vue'
// 这就是「Vue.js API 自动导入」
const counter = ref<number>(0);

// 定义一个 message 属性，类型为 string
defineProps<{
  message: string
}>()

useKeyPress('j',() => {
  counter.value++;
})
</script>
