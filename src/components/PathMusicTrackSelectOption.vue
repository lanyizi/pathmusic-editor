<template>
  <SelectOption :choices="trackList" v-model="selected" />
</template>
<script setup lang="ts">
import { computed, inject } from 'vue';
import { modelKey } from '@/model';
import SelectOption from '@/components/controls/SelectOption.vue';

const props = defineProps<{
  modelValue: number;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: number): void;
}>();

const model = inject(modelKey)!;
if (!model) {
  throw new Error('model is not provided');
}

const selected = computed({
  get() {
    return `${props.modelValue}`;
  },
  set(value) {
    emit('update:modelValue', parseInt(value));
  },
});

const trackList = computed(() => {
  return model.value.data.tracks.map((track, i) => ({
    value: `${i}`,
    text: `#${i} ${track.path}`,
  }));
});
</script>
