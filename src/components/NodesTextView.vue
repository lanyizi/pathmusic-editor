<template>
  <div class="nodes-view">
    <div
      v-for="node in props.model.data.nodes"
      :key="node.id"
      @click="emit('node-selected', node)"
    >
      {{ node.id }}
    </div>
  </div>
</template>
<script setup lang="ts">
import { type PathMusicNode, type Model } from '@/model';
import { type PropType } from 'vue';

const props = defineProps({
  model: {
    type: Object as PropType<Model>,
    required: true,
  },
});

const emit = defineEmits<{
  (event: 'node-selected', node: PathMusicNode): void;
}>();
</script>
<style scoped>
.nodes-view {
  /* scrollable */
  overflow-y: auto;
}
</style>
