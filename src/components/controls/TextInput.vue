<template>
  <input
    :type="type"
    :disabled="isDisabled"
    :value="value"
    :input="input"
    :class="{ short: isInputShort }"
  />
</template>
<script setup lang="ts" generic="T extends number | string">
import { computed } from 'vue';

const props = defineProps<{
  modelValue: T;
  type: T extends number ? 'number' : 'text';
  long?: boolean;
  disabled?: boolean;
}>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: T): void;
}>();
const type = computed(() => props.type);
const value = computed(() => props.modelValue);
const isDisabled = computed(() => props.disabled);
const isInputShort = computed(() => !props.long);
function input(event: Event) {
  if (isDisabled.value) {
    return;
  }
  const target = event.target as HTMLInputElement;
  const value = target.value;
  const normalized = props.type === 'number' ? Number(value) : `${value}`;
  emit('update:modelValue', normalized as T);
}
</script>
<style scoped>
.edit-button {
  margin-left: 0.5em;
}
input.short {
  width: 5em;
}
</style>
