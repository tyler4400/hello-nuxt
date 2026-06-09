<template>
  <div>user detail page</div>
  <div>{{ route.params.id }}</div>
</template>

<script lang="ts" setup>
const route = useRoute()
</script>
