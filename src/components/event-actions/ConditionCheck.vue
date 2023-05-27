<template>
  <div>
    <template v-if="editing">
      <EventVariableSelectOption :allowSpecialValues="false" v-model="left" />
      <SelectOption :choices="Comparisons" v-model="comparison"></SelectOption>
      <TextInput type="number" v-model="right" />
    </template>
    <template v-else>
      <span>{{ left }}</span>
      <span>{{ comparison }}</span>
      <span>{{ right }}</span>
    </template>
  </div>
</template>
<script setup lang="ts">
import { Comparisons, type ElseIfAction, type IfAction } from '@/model';
import { useFieldWrapper } from '@/composables/useFieldWrappers';
import SelectOption from '@/components/controls/SelectOption.vue';
import TextInput from '@/components/controls/TextInput.vue';
import EventVariableSelectOption from '@/components/EventVariableSelectOption.vue';

type ConditionCheck = IfAction | ElseIfAction;
const props = defineProps<{
  modelValue: ConditionCheck;
  editing: boolean;
}>();

const emit = defineEmits<{
  (event: 'update:modelValue', value: ConditionCheck): void;
  (event: 'update:cancel'): void;
}>();

const { left, comparison, right } = useFieldWrapper(props, emit);
</script>
