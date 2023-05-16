<template>
  <div>
    <input
      v-if="editing"
      :type="type"
      :value="modelValue"
      @input="doEmit($event)"
    />
    <slot v-else>{{ modelValue }}</slot>
    <button @click="editing = !editing">
      <template v-if="editing">OK</template>
      <template v-else>Edit</template>
    </button>
  </div>
</template>
<script setup lang="ts" generic="T extends number | string">
import { computed, ref } from 'vue';

const props = defineProps<{
  modelValue: T;
}>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: T): void;
}>();
const type = computed(() =>
  typeof props.modelValue === 'number' ? 'number' : 'text'
);
const editing = ref(false);

function doEmit(event: Event) {
  const value = (event.target as HTMLInputElement).value;
  const outputValue = type.value === 'number' ? parseInt(value) : value;
  emit('update:modelValue', outputValue as T);
}
</script>
