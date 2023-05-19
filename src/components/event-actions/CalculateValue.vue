<template>
  <div>
    <template v-if="editing">
      <TextInput type="text" v-model="left" />
      <SelectOption :choices="Operators" v-model="operator"></SelectOption>
      <TextInput type="number" v-model="right" />
    </template>
    <template v-else>
      <span>{{ left }}</span>
      <span>{{ operator }}</span>
      <span>{{ right }}</span>
    </template>
  </div>
</template>
<script setup lang="ts">
import { Operators, type CalculateAction } from '@/model';
import { useFieldWrapper } from '@/composables/useFieldWrappers';
import SelectOption from '@/components/controls/SelectOption.vue';
import TextInput from '@/components/controls/TextInput.vue';

const props = defineProps<{
  modelValue: CalculateAction;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: CalculateAction): void;
  (event: 'update:cancel'): void;
}>();

const { left, operator, right } = useFieldWrapper(props, emit);
</script>
