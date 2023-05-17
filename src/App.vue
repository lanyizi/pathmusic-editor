<script setup lang="ts">
import { RouterView } from 'vue-router';
</script>

<template>
  <div class="container">
    <RouterView class="content" />
  </div>
</template>

<style scoped>
html {
  background-color: var(--color-background);
}

.container {
  height: 100vh;
  display: grid;
  grid-template-rows: minmax(0, 1fr);
}
</style>
