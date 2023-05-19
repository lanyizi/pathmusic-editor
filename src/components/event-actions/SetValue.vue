<template>
  <div>
    <template v-if="editing">
      <TextInput type="text" v-model="left" />
      =
      <TextInput type="number" :disabled="useRandom" v-model="right" />
      <label>
        <input type="checkbox" v-model="useRandom" />
        Random
      </label>
    </template>
    <template v-else>
      <span>{{ left }}</span>
      <span>=</span>
      <span>{{ right }}</span>
    </template>
  </div>
</template>
<script setup lang="ts">
import { computed } from 'vue';
import { type SetValueAction } from '@/model';
import { useFieldWrapper } from '@/composables/useFieldWrappers';
import TextInput from '@/components/controls/TextInput.vue';

const props = defineProps<{
  modelValue: SetValueAction;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: SetValueAction): void;
  (event: 'update:cancel'): void;
}>();

const { left, right } = useFieldWrapper(props, emit);
const useRandom = computed({
  get: () => right.value === 'PATH_RANDOMSHORT',
  set: (value) => {
    if (value) {
      right.value = 'PATH_RANDOMSHORT';
    } else {
      right.value = 0;
    }
  },
});
</script>
