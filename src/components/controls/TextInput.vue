<template>
  <span>
    <input v-if="editing" :type="type" v-model="value" />
    <slot v-else>{{ modelValue }}</slot>
    <button v-if="!editing" key="Edit" class="edit-button" @click="edit">
      Edit
    </button>
    <template v-if="editing">
      <button class="edit-button" key="Ok" @click="ok">OK</button>
      <button class="edit-button" key="Cancel" @click="cancel">Cancel</button>
    </template>
  </span>
</template>
<script setup lang="ts" generic="T extends number | string">
import { ref } from 'vue';

const props = defineProps<{
  modelValue: T;
  type: 'number' | 'text';
}>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: T): void;
}>();
const editing = ref(false);
const value = ref(props.modelValue);

let lastChange = performance.now();
function isFrequentChange() {
  if (performance.now() - lastChange < 300) {
    return true;
  }
  lastChange = performance.now();
  return false;
}

function edit() {
  if (isFrequentChange()) {
    return;
  }
  lastChange = performance.now();
  editing.value = true;
}
function ok() {
  if (isFrequentChange()) {
    return;
  }
  editing.value = false;
  if (props.type === 'number') {
    emit('update:modelValue', +value.value as T);
  } else {
    emit('update:modelValue', `${value.value}` as T);
  }
}
function cancel() {
  if (isFrequentChange()) {
    return;
  }
  editing.value = false;
  if (props.type === 'number') {
    value.value = +props.modelValue as any;
  } else {
    value.value = `${props.modelValue}` as any;
  }
}
</script>
<style scoped>
.edit-button {
  margin-left: 0.5em;
}
</style>
