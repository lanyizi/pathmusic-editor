<template>
  <div class="nodes-view">
    <div v-for="node in props.model.data.nodes" :key="node.id">
      <RouterLink :to="{ query: createQuery('node', node.id) }">{{
        node.id
      }}</RouterLink>
    </div>
  </div>
</template>
<script setup lang="ts">
import { type Model } from '@/model';
import { createQuery } from '@/router/create-query';

const props = defineProps<{ model: Model }>();
</script>
<style scoped>
.nodes-view {
  /* scrollable */
  overflow-y: auto;
}
</style>
