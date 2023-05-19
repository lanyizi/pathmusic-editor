<template>
  <select :value="value" @change="update">
    <option v-for="{ text, value } in options" :key="text" :value="value">
      {{ text }}
    </option>
  </select>
</template>
<script setup lang="ts" generic="T extends string">
import type { Immutable } from '@/immutable';
import { computed } from 'vue';

type Descriptive = { value: T; text: string };

const props = defineProps<{
  choices: Immutable<T[] | Descriptive[]>;
  modelValue: T;
}>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: T): void;
}>();

const options = computed(() => {
  function isObject(
    array: Immutable<any[]>
  ): array is Immutable<Descriptive[]> {
    return array.some((x) => x?.value ?? x?.text);
  }
  if (isObject(props.choices)) {
    return props.choices;
  }
  return props.choices.map((value) => ({ value, text: value }));
});
const value = computed(() => props.modelValue);

function update(event: Event) {
  const target = event.target as HTMLSelectElement;
  emit('update:modelValue', target.value as T);
}
</script>
<style scoped>
.edit-button {
  margin-left: 0.5em;
}
</style>
