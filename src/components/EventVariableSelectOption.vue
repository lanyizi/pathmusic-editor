<template>
  <SelectOption
    :choices="eventVariableList"
    :modelValue="props.modelValue"
    @update:modelValue="emit('update:modelValue', $event)"
  />
</template>
<script setup lang="ts">
import { computed, inject } from 'vue';
import { modelKey, SetValueSpecialLeftValues } from '@/model';
import SelectOption from '@/components/controls/SelectOption.vue';

const props = defineProps<{
  modelValue: string;
  allowSpecialValues: boolean;
}>();
const emit = defineEmits<{
  (event: 'update:modelValue', value: string): void;
}>();

const model = inject(modelKey)!;
if (!model) {
  throw new Error('model is not provided');
}

const eventVariableList = computed(() => {
  const variables = model.value.data.variables.map(
    (variable) => `vars['${variable[0]}']`
  );
  if (!props.allowSpecialValues) {
    return variables;
  }
  return variables.concat(SetValueSpecialLeftValues);
});
</script>
