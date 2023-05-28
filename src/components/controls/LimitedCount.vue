<template>
  <span class="limited-count" :class="level"
    ><span>{{ current }}</span
    ><span>/</span><span>{{ errorThreshold }}</span></span
  >
</template>
<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  current: number;
  warningThreshold?: number;
  errorThreshold: number;
}>();

const level = computed(() => {
  const { current, errorThreshold } = props;
  if (current > errorThreshold) {
    return 'error';
  }
  const warningThreshold = props.warningThreshold ?? errorThreshold * 0.7;
  if (current > warningThreshold) {
    return 'warning';
  }
  return 'normal';
});
</script>
<style scoped>
.limited-count {
  display: inline-flex;
  gap: 0.5em;
}
.limited-count.warning > span {
  color: #f80;
}
.limited-count.error > span {
  color: #f00;
  font-weight: bold;
}
</style>
