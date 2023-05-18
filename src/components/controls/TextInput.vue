<template>
  <span>
    <input
      v-if="editing"
      :type="type"
      v-model="value"
      :class="{ short: isInputShort }"
    />
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
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  modelValue: T;
  type: 'number' | 'text';
  long?: boolean;
  state?: 'normal' | 'editing';
}>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: T): void;
  (event: 'update:cancel'): void;
  (event: 'state', value: 'normal' | 'editing'): void;
}>();
const localEditing = ref(false);
const editing = computed({
  get() {
    if (props.state === 'editing') {
      return true;
    } else if (props.state === 'normal') {
      return false;
    }
    return localEditing.value;
  },
  set(value) {
    if (props.state !== 'editing' && props.state !== 'normal') {
      localEditing.value = value;
    }
    emit('state', value ? 'editing' : 'normal');
  },
});
const value = ref(props.modelValue);
const isInputShort = computed(() => !props.long);

watch(
  () => props.modelValue,
  (newValue) => {
    value.value = newValue as any;
  }
);

let lastChange = performance.now() - 300;
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
  emit('update:cancel');
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
